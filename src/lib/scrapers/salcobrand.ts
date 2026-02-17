/**
 * PRO-58: Salcobrand scraper
 *
 * Anti-bot: Cloudflare + reCAPTCHA → playwright-extra stealth + random delays.
 * May require a CAPTCHA solving service (2captcha / anti-captcha) for production.
 */

import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import type { ScrapedPrice, ScraperOptions, ScraperResult } from './base'

chromium.use(StealthPlugin())

const CHAIN = 'SALCOBRAND' as const
const BASE_URL = 'https://salcobrand.cl'

export async function discoverEndpoints(searchTerm: string): Promise<void> {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  page.on('request', (req) => {
    if (['fetch', 'xhr'].includes(req.resourceType())) {
      const url = req.url()
      if (url.includes('product') || url.includes('search') || url.includes('catalog')) {
        console.log(`[Salcobrand] ${req.method()} ${url}`)
      }
    }
  })

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 })
  const searchBox = page.locator('input[type="search"], input[name="q"]').first()
  await searchBox.fill(searchTerm)
  await searchBox.press('Enter')
  await page.waitForTimeout(5000)
  await browser.close()
}

function randomDelay(base: number): Promise<void> {
  const jitter = Math.floor(Math.random() * 1000)
  return new Promise((r) => setTimeout(r, base + jitter))
}

export async function scrape(
  queries: string[],
  opts: ScraperOptions = {}
): Promise<ScraperResult> {
  const { headless = true, delayMs = 2000 } = opts
  const errors: string[] = []
  const prices: ScrapedPrice[] = []

  const browser = await chromium.launch({ headless })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
  })

  try {
    const page = await context.newPage()

    for (const query of queries) {
      try {
        await page.goto(`${BASE_URL}/search?q=${encodeURIComponent(query)}`, {
          waitUntil: 'networkidle',
          timeout: 30_000,
        })

        // Extract product cards — selectors must be verified in browser
        const products = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('[data-product-id], .product-item'))
          return cards.map((card) => ({
            name: card.querySelector('.product-name, h3, h2')?.textContent?.trim() ?? '',
            price: parseFloat(
              (card.querySelector('.price, [data-price]')?.textContent ?? '0')
                .replace(/[^\d]/g, '')
            ),
            inStock: !card.querySelector('.out-of-stock, .sin-stock'),
          }))
        })

        for (const p of products) {
          if (!p.name || !p.price) continue
          prices.push({
            productName: p.name,
            price: p.price,
            inStock: p.inStock,
            storeId: 'online',
            storeName: 'Salcobrand Online',
            storeAddress: 'Sitio web',
            commune: 'Online',
            region: 'Online',
            chain: CHAIN,
          })
        }

        await randomDelay(delayMs)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`[Salcobrand] query="${query}": ${msg}`)
      }
    }
  } finally {
    await browser.close()
  }

  return { chain: CHAIN, prices, errors, scrapedAt: new Date() }
}
