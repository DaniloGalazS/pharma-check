/**
 * PRO-59: Farmacias Ahumada scraper
 *
 * Anti-bot: Queue-it bot management → simulate human behavior with delays.
 * Tech stack: PHP backend, Queue-it queue management.
 */

import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import type { ScrapedPrice, ScraperOptions, ScraperResult } from './base'

chromium.use(StealthPlugin())

const CHAIN = 'AHUMADA' as const
const BASE_URL = 'https://www.farmaciasahumada.cl'

export async function discoverEndpoints(searchTerm: string): Promise<void> {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  page.on('request', (req) => {
    if (['fetch', 'xhr'].includes(req.resourceType())) {
      const url = req.url()
      if (!url.includes('queue-it') && !url.includes('analytics')) {
        console.log(`[Ahumada] ${req.method()} ${url}`)
      }
    }
  })

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 })
  const searchBox = page.locator('input[type="search"], input[name="q"], input[id*="search"]').first()
  await searchBox.fill(searchTerm)
  await searchBox.press('Enter')
  await page.waitForTimeout(6000) // Queue-it may add latency
  await browser.close()
}

/** Simulate human-like scrolling to avoid Queue-it detection */
async function humanScroll(page: import('playwright').Page): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, 300 + Math.random() * 200)
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500))
  }
}

export async function scrape(
  queries: string[],
  opts: ScraperOptions = {}
): Promise<ScraperResult> {
  const { headless = true, delayMs = 3000 } = opts
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
        await page.goto(`${BASE_URL}/search?q=${encodeURIComponent(query)}`, {
          waitUntil: 'domcontentloaded',
          timeout: 45_000, // Extra timeout for Queue-it
        })

        // Wait for Queue-it to pass (if triggered)
        await page.waitForFunction(() => !document.querySelector('[data-queue-it]'), {
          timeout: 15_000,
        }).catch(() => {}) // Ignore if Queue-it element not found

        await humanScroll(page)

        const products = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('.product-tile, [class*="product-item"]'))
          return cards.map((card) => ({
            name: card.querySelector('.product-name, h3')?.textContent?.trim() ?? '',
            price: parseFloat(
              (card.querySelector('.price, [class*="price"]')?.textContent ?? '0')
                .replace(/[^\d]/g, '')
            ),
            inStock: !card.querySelector('.out-of-stock, [class*="sin-stock"]'),
          }))
        })

        for (const p of products) {
          if (!p.name || !p.price) continue
          prices.push({
            productName: p.name,
            price: p.price,
            inStock: p.inStock,
            storeId: 'online',
            storeName: 'Farmacias Ahumada Online',
            storeAddress: 'Sitio web',
            commune: 'Online',
            region: 'Online',
            chain: CHAIN,
          })
        }

        await new Promise((r) => setTimeout(r, delayMs + Math.random() * 1500))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`[Ahumada] query="${query}": ${msg}`)
      }
    }
  } finally {
    await browser.close()
  }

  return { chain: CHAIN, prices, errors, scrapedAt: new Date() }
}
