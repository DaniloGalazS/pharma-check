/**
 * GET /api/medications/[id]/prices?days=30
 * Returns price history for a medication (for the chart).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const days = Math.min(parseInt(req.nextUrl.searchParams.get('days') ?? '30'), 90)
  const since = new Date(Date.now() - days * 24 * 3_600_000)

  const prices = await prisma.price.findMany({
    where: {
      medicationId: id,
      scrapedAt: { gte: since },
    },
    orderBy: { scrapedAt: 'asc' },
    include: { pharmacy: { select: { chain: true } } },
  })

  const data = prices.map((p) => ({
    date: p.scrapedAt.toISOString().split('T')[0],
    chain: p.pharmacy.chain,
    price: Number(p.price),
  }))

  return NextResponse.json(data)
}
