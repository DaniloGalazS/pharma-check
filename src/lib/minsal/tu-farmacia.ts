/**
 * PRO-56: Tu Farmacia MINSAL — price catalog sync
 *
 * Oficial government price comparison site: https://www.tufarmacia.gob.cl
 * No public API — uses Playwright to scrape the internal search API.
 * Dataset: ~11,726 medications, updated monthly (SERNAC + ISP data).
 */

import { chromium } from 'playwright'

export interface TuFarmaciaMedication {
  codigo: string
  nombreProducto: string
  principioActivo: string
  laboratorio: string
  concentracion: string
  presentacion: string
  cantidad: string
  precios: TuFarmaciaPrice[]
}

export interface TuFarmaciaPrice {
  nombreFarmacia: string
  cadena: string
  precio: number
  direccion?: string
  comuna?: string
}

const TU_FARMACIA_URL = 'https://www.tufarmacia.gob.cl'

/**
 * Discover the internal JSON API endpoint used by tufarmacia.gob.cl
 * by intercepting XHR/fetch requests during a search.
 *
 * Usage: run once manually or in dev to capture the real endpoint,
 * then hardcode it in searchMedications().
 */
export async function discoverApiEndpoint(searchTerm: string): Promise<string[]> {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const endpoints: string[] = []

  page.on('request', (req) => {
    const url = req.url()
    if (req.resourceType() === 'fetch' || req.resourceType() === 'xhr') {
      if (url.includes('api') || url.includes('search') || url.includes('producto')) {
        endpoints.push(`${req.method()} ${url}`)
      }
    }
  })

  await page.goto(TU_FARMACIA_URL, { waitUntil: 'networkidle' })
  // Interact with search box — selector may change; inspect in browser
  const searchInput = page.locator('input[type="search"], input[placeholder*="medicamento" i]').first()
  await searchInput.fill(searchTerm)
  await searchInput.press('Enter')
  await page.waitForTimeout(3000)

  await browser.close()
  return endpoints
}

/**
 * Search medications on Tu Farmacia MINSAL.
 *
 * NOTE: The internal API endpoint must be verified by running discoverApiEndpoint()
 * and inspecting network traffic. The URL below is a best-guess placeholder.
 */
export async function searchMedications(query: string): Promise<TuFarmaciaMedication[]> {
  // TODO: replace with discovered internal API endpoint
  const API_ENDPOINT = process.env.TU_FARMACIA_API_URL ?? `${TU_FARMACIA_URL}/api/productos`

  const res = await fetch(`${API_ENDPOINT}?q=${encodeURIComponent(query)}&limit=100`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PharmaCheck/1.0)',
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`Tu Farmacia API error: ${res.status}`)
  }

  return res.json() as Promise<TuFarmaciaMedication[]>
}

/** Full catalog sync — iterates through all medications */
export async function* syncCatalog(): AsyncGenerator<TuFarmaciaMedication[]> {
  // Tu Farmacia's catalog can be paginated through product codes or alphabetically
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  for (const letter of alphabet) {
    try {
      const results = await searchMedications(letter)
      if (results.length > 0) yield results
    } catch (err) {
      console.error(`Tu Farmacia sync error for letter ${letter}:`, err)
    }
  }
}
