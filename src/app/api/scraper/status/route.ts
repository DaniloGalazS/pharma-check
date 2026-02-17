/**
 * PRO-64: Scraper monitoring endpoint
 *
 * GET /api/scraper/status           — status of all chains (last run)
 * GET /api/scraper/status?chain=X   — status of specific chain
 * GET /api/scraper/status?limit=50  — last N runs across all chains
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import type { Chain } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const chainParam = req.nextUrl.searchParams.get('chain') as Chain | null
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '10'), 100)

  if (chainParam) {
    // Single chain: last N runs
    const runs = await prisma.scraperRun.findMany({
      where: { chain: chainParam },
      orderBy: { startedAt: 'desc' },
      take: limit,
    })
    return NextResponse.json({ chain: chainParam, runs })
  }

  // All chains: last run per chain
  const chains: Chain[] = ['CRUZ_VERDE', 'SALCOBRAND', 'AHUMADA', 'SIMILARES']
  const summary = await Promise.all(
    chains.map(async (chain) => {
      const last = await prisma.scraperRun.findFirst({
        where: { chain },
        orderBy: { startedAt: 'desc' },
      })
      return { chain, lastRun: last ?? null }
    })
  )

  return NextResponse.json({ summary })
}
