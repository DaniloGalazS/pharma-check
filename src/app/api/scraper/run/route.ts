/**
 * PRO-63: Cron job trigger endpoint
 *
 * Called by Vercel Cron every 6 hours (configured in vercel.json).
 * Protected by CRON_SECRET to prevent unauthorized triggers.
 *
 * POST /api/scraper/run?chain=CRUZ_VERDE   — run specific chain
 * POST /api/scraper/run                    — run all chains
 */

import { NextRequest, NextResponse } from 'next/server'
import { recordScraperRun, finishScraperRun, persistScraperResults } from '@/lib/db/upsert'
import type { Chain } from '@prisma/client'

const SUPPORTED_CHAINS: Chain[] = ['CRUZ_VERDE', 'SALCOBRAND', 'AHUMADA', 'SIMILARES']

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}

async function runChain(chain: Chain): Promise<{ inserted: number; errors: number }> {
  const runId = await recordScraperRun(chain, 'RUNNING')

  try {
    // Dynamic import to keep each scraper isolated
    let result
    switch (chain) {
      case 'CRUZ_VERDE': {
        const { scrape } = await import('@/lib/scrapers/cruz-verde')
        result = await scrape([], { headless: true })
        break
      }
      case 'SALCOBRAND': {
        const { scrape } = await import('@/lib/scrapers/salcobrand')
        result = await scrape([], { headless: true })
        break
      }
      case 'AHUMADA': {
        const { scrape } = await import('@/lib/scrapers/ahumada')
        result = await scrape([], { headless: true })
        break
      }
      case 'SIMILARES': {
        const { scrape } = await import('@/lib/scrapers/similares')
        result = await scrape([], { headless: true })
        break
      }
      default:
        throw new Error(`Unsupported chain: ${chain}`)
    }

    const { inserted, errors } = await persistScraperResults(result.prices)
    const hasErrors = result.errors.length > 0 || errors > 0
    const status = hasErrors ? 'PARTIAL' : 'SUCCESS'

    await finishScraperRun(runId, status, {
      recordsUpdated: inserted,
      errorMessage: result.errors.length > 0 ? result.errors.join('\n') : undefined,
    })

    return { inserted, errors }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await finishScraperRun(runId, 'FAILED', { errorMessage: msg })
    throw err
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const chainParam = req.nextUrl.searchParams.get('chain') as Chain | null
  const chains = chainParam ? [chainParam] : SUPPORTED_CHAINS

  const results: Record<string, unknown> = {}

  await Promise.allSettled(
    chains.map(async (chain) => {
      try {
        results[chain] = await runChain(chain)
      } catch (err) {
        results[chain] = { error: err instanceof Error ? err.message : String(err) }
      }
    })
  )

  return NextResponse.json({ ok: true, results })
}
