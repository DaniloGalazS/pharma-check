/**
 * GET /api/medications/suggest?q=paracetamol&limit=8
 * Returns medication name suggestions for the search autocomplete.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '8'), 20)

  if (q.length < 2) return NextResponse.json([])

  const medications = await prisma.medication.findMany({
    where: {
      OR: [
        { commercialName: { contains: q, mode: 'insensitive' } },
        { genericName:    { contains: q, mode: 'insensitive' } },
        { activePrinciple: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      genericName: true,
      commercialName: true,
      activePrinciple: true,
    },
    take: limit,
    orderBy: { genericName: 'asc' },
  })

  return NextResponse.json(medications)
}
