/**
 * PRO-60: Farmacias Similares (Dr. Simi) scraper
 *
 * Lower bot protection than other chains.
 * May have internal mobile app API worth reverse-engineering (Proxyman/mitmproxy).
 * 505 locations in Chile.
 */

import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import type { ScrapedPrice, ScraperOptions, ScraperResult } from './base'

chromium.use(StealthPlugin())

const CHAIN = 'SIMILARES' as const
const BASE_URL = 'https://www.drsimi.cl'

/** Internal API URL discovered via mobile app reverse-engineering or DevTools */
const API_BASE = process.env.SIMILARES_API_URL ?? `${BASE_URL}/api`

interface SimilaresProduct {
  id: string
  nombre: string
  ean?: string
  precio: number
  stock: boolean
  sucursal?: string
}

/** Attempt direct API call first (more reliable than HTML scraping) */
async function tryDirectApi(query: string): Promise<SimilaresProduct[] | null> {
  try {
    const res = await fetch(
      `${API_BASE}/productos?busqueda=${encodeURIComponent(query)}&limit=100`,
      {
        headers: {
          'User-Agent': 'DrSimi/1.0 (iOS)',
          Accept: 'application/json',
          'Accept-Language': 'es-CL',
        },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) ? data : data.productos ?? null
  } catch {
    return null
  }
}

export async function discoverEndpoints(searchTerm: string): Promise<void> {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  page.on('request', (req) => {
    if (['fetch', 'xhr'].includes(req.resourceType())) {
      console.log(`[DrSimi] ${req.method()} ${req.url()}`)
    }
  })

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 })
  const searchBox = page.locator('input[type="search"], input[name="q"]').first()
  await searchBox.fill(searchTerm)
  await searchBox.press('Enter')
  await page.waitForTimeout(4000)
  await browser.close()
}

export async function scrape(
  queries: string[],
  opts: ScraperOptions = {}
): Promise<ScraperResult> {
  const { headless = true, delayMs = 1000 } = opts
  const errors: string[] = []
  const prices: ScrapedPrice[] = []

  // Try direct API first; fall back to Playwright if needed
  for (const query of queries) {
    const apiResult = await tryDirectApi(query)

    if (apiResult) {
      for (const p of apiResult) {
        prices.push({
          productName: p.nombre,
          ean: p.ean,
          price: p.precio,
          inStock: p.stock,
          storeId: p.sucursal ?? 'online',
          storeName: 'Dr. Simi Online',
          storeAddress: 'Sitio web',
          commune: 'Online',
          region: 'Online',
          chain: CHAIN,
        })
      }
      await new Promise((r) => setTimeout(r, delayMs))
      continue
    }

    // Fallback to Playwright
    const browser = await chromium.launch({ headless })
    const context = await browser.newContext({
      locale: 'es-CL',
      timezoneId: 'America/Santiago',
    })
    try {
      const page = await context.newPage()
      await page.goto(`${BASE_URL}/search?q=${encodeURIComponent(query)}`, {
        waitUntil: 'networkidle',
        timeout: 30_000,
      })

      const products = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.product-card, [class*="producto"]'))
        return cards.map((card) => ({
          name: card.querySelector('h3, .product-title, .nombre')?.textContent?.trim() ?? '',
          price: parseFloat(
            (card.querySelector('.price, .precio')?.textContent ?? '0').replace(/[^\d]/g, '')
          ),
          inStock: !card.querySelector('.agotado, .out-of-stock'),
        }))
      })

      for (const p of products) {
        if (!p.name || !p.price) continue
        prices.push({
          productName: p.name,
          price: p.price,
          inStock: p.inStock,
          storeId: 'online',
          storeName: 'Dr. Simi Online',
          storeAddress: 'Sitio web',
          commune: 'Online',
          region: 'Online',
          chain: CHAIN,
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`[DrSimi] query="${query}": ${msg}`)
    } finally {
      await browser.close()
    }
  }

  return { chain: CHAIN, prices, errors, scrapedAt: new Date() }
}
