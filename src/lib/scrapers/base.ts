/**
 * Base scraper interface — all chain scrapers implement this.
 */

import type { Chain } from '@prisma/client'

export interface ScrapedPrice {
  /** Canonical product name as shown on the pharmacy's website */
  productName: string
  /** EAN/barcode if available */
  ean?: string
  /** Price in CLP */
  price: number
  /** null = unknown, true/false = explicit stock status */
  inStock: boolean | null
  /** Pharmacy store identifier (branch code or address) */
  storeId: string
  storeName: string
  storeAddress: string
  commune: string
  region: string
  chain: Chain
}

export interface ScraperResult {
  chain: Chain
  prices: ScrapedPrice[]
  errors: string[]
  scrapedAt: Date
}

export interface ScraperOptions {
  /** Max concurrent browser pages */
  concurrency?: number
  /** Delay between requests in ms */
  delayMs?: number
  /** Whether to run browser headless */
  headless?: boolean
}
