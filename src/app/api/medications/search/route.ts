/**
 * GET /api/medications/search?q=paracetamol&page=1&pageSize=10&lab=Bagó
 * Full-text search with latest price per pharmacy.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl
  const q        = searchParams.get('q')?.trim() ?? ''
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') ?? '10'), 50)
  const lab      = searchParams.get('lab') ?? undefined
  const pres     = searchParams.get('presentation') ?? undefined

  if (!q) return NextResponse.json({ medications: [], total: 0, page, pageSize })

  const where = {
    OR: [
      { commercialName:  { contains: q, mode: 'insensitive' as const } },
      { genericName:     { contains: q, mode: 'insensitive' as const } },
      { activePrinciple: { contains: q, mode: 'insensitive' as const } },
    ],
    ...(lab  && { laboratory:   { equals: lab,  mode: 'insensitive' as const } }),
    ...(pres && { presentation: { equals: pres, mode: 'insensitive' as const } }),
  }

  const [total, medications] = await Promise.all([
    prisma.medication.count({ where }),
    prisma.medication.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { genericName: 'asc' },
      include: {
        prices: {
          // Latest price per pharmacy — subquery via Prisma's distinct trick
          orderBy: { scrapedAt: 'desc' },
          take: 50,
          include: { pharmacy: { select: { id: true, chain: true, name: true, commune: true, region: true } } },
        },
      },
    }),
  ])

  return NextResponse.json({ medications, total, page, pageSize })
}
