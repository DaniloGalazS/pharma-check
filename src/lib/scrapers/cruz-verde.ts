/**
 * PRO-57: Cruz Verde scraper
 *
 * Anti-bot: Cloudflare WAF → uses playwright-extra with stealth plugin.
 * Internal API: Discovered via DevTools Network tab on cruzverde.cl.
 *
 * NOTE: Endpoint URLs must be verified by inspecting network traffic.
 * Run with: npx ts-node src/lib/scrapers/cruz-verde.ts --discover
 */

import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import type { ScrapedPrice, ScraperOptions, ScraperResult } from './base'

chromium.use(StealthPlugin())

const CHAIN = 'CRUZ_VERDE' as const
const BASE_URL = 'https://www.cruzverde.cl'

/** Best-guess internal API endpoint — verify via DevTools */
const SEARCH_API = `${BASE_URL}/api/v1/catalog/search`

interface CruzVerdeProduct {
  id: string
  name: string
  ean?: string
  price: number
  stock?: boolean
  sku: string
}

interface CruzVerdeStore {
  id: string
  name: string
  address: string
  commune: string
  region: string
}

/**
 * Intercept network requests to discover the real search API endpoint.
 * Run once in development; results go to console.
 */
export async function discoverEndpoints(searchTerm: string): Promise<void> {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  page.on('request', (req) => {
    if (['fetch', 'xhr'].includes(req.resourceType())) {
      const url = req.url()
      if (url.includes('catalog') || url.includes('search') || url.includes('product')) {
        console.log(`[CruzVerde] ${req.method()} ${url}`)
        const body = req.postData()
        if (body) console.log('  Body:', body)
      }
    }
  })

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 })
  const searchBox = page.locator('input[name="q"], input[aria-label*="buscar" i], input[placeholder*="buscar" i]').first()
  await searchBox.fill(searchTerm)
  await searchBox.press('Enter')
  await page.waitForTimeout(5000)
  await browser.close()
}

/** Search for a product on Cruz Verde's website */
async function searchProduct(
  query: string,
  page: import('playwright').Page
): Promise<CruzVerdeProduct[]> {
  // Intercept the JSON response from the search API
  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('search') && res.request().resourceType() === 'fetch',
      { timeout: 10_000 }
    ),
    page.goto(`${BASE_URL}/search?q=${encodeURIComponent(query)}`, { waitUntil: 'networkidle' }),
  ])

  const body = await response.json().catch(() => null)
  // Shape varies — adapt to actual API response structure
  return (body?.products ?? body?.items ?? []) as CruzVerdeProduct[]
}

export async function scrape(
  queries: string[],
  opts: ScraperOptions = {}
): Promise<ScraperResult> {
  const { headless = true, delayMs = 1500 } = opts
  const errors: string[] = []
  const prices: ScrapedPrice[] = []

  const browser = await chromium.launch({ headless })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
  })

  try {
    const page = await context.newPage()

    for (const query of queries) {
      try {
        const products = await searchProduct(query, page)

        for (const p of products) {
          prices.push({
            productName: p.name,
            ean: p.ean,
            price: p.price,
            inStock: p.stock ?? null,
            storeId: 'online',
            storeName: 'Cruz Verde Online',
            storeAddress: 'Sitio web',
            commune: 'Online',
            region: 'Online',
            chain: CHAIN,
          })
        }

        // Polite delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, delayMs))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`[CruzVerde] query="${query}": ${msg}`)
      }
    }
  } finally {
    await browser.close()
  }

  return { chain: CHAIN, prices, errors, scrapedAt: new Date() }
}
