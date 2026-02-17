/**
 * DB helpers for upserting scraper results into PostgreSQL.
 * Uses cuid-style IDs via crypto.randomUUID() for portability.
 */

import { prisma } from './prisma'
import { normalizeMedication } from '@/lib/utils/normalize'
import type { ScrapedPrice } from '@/lib/scrapers/base'
import type { Chain } from '@prisma/client'

function cuid(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

/** Upsert a pharmacy branch, return its DB id */
async function upsertPharmacy(p: ScrapedPrice): Promise<string> {
  const key = `${p.chain}:${p.storeId}`

  const existing = await prisma.pharmacy.findFirst({
    where: { chain: p.chain as Chain, externalId: p.storeId },
    select: { id: true },
  })

  if (existing) return existing.id

  const created = await prisma.pharmacy.create({
    data: {
      id: cuid(),
      chain: p.chain as Chain,
      name: p.storeName,
      address: p.storeAddress,
      commune: p.commune,
      region: p.region,
      externalId: p.storeId,
    },
    select: { id: true },
  })

  return created.id
}

/** Upsert a medication by EAN or name+presentation, return its DB id */
async function upsertMedication(p: ScrapedPrice): Promise<string> {
  // Try EAN-based lookup first
  if (p.ean) {
    const byEan = await prisma.medication.findFirst({
      where: { ean: p.ean },
      select: { id: true },
    })
    if (byEan) return byEan.id
  }

  const normalized = normalizeMedication({ productName: p.productName, ean: p.ean })

  // Name-based lookup (exact on commercialName)
  const byName = await prisma.medication.findFirst({
    where: { commercialName: normalized.commercialName },
    select: { id: true },
  })
  if (byName) return byName.id

  const created = await prisma.medication.create({
    data: {
      id: cuid(),
      genericName: normalized.genericName,
      commercialName: normalized.commercialName,
      laboratory: normalized.laboratory,
      concentration: normalized.concentration,
      presentation: normalized.presentation,
      quantity: normalized.quantity,
      ean: normalized.ean,
    },
    select: { id: true },
  })

  return created.id
}

/** Persist a batch of scraped prices to the DB */
export async function persistScraperResults(
  results: ScrapedPrice[]
): Promise<{ inserted: number; errors: number }> {
  let inserted = 0
  let errors = 0

  for (const item of results) {
    try {
      const [pharmacyId, medicationId] = await Promise.all([
        upsertPharmacy(item),
        upsertMedication(item),
      ])

      await prisma.price.create({
        data: {
          id: cuid(),
          medicationId,
          pharmacyId,
          price: item.price,
          inStock: item.inStock,
        },
      })

      inserted++
    } catch (err) {
      console.error('[persistScraperResults]', err)
      errors++
    }
  }

  return { inserted, errors }
}

/** Record a scraper run in the monitoring table */
export async function recordScraperRun(
  chain: Chain,
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'PARTIAL',
  opts: { recordsUpdated?: number; errorMessage?: string } = {}
): Promise<string> {
  const run = await prisma.scraperRun.create({
    data: {
      id: cuid(),
      chain,
      status,
      ...opts,
    },
    select: { id: true },
  })
  return run.id
}

export async function finishScraperRun(
  runId: string,
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL',
  opts: { recordsUpdated?: number; errorMessage?: string } = {}
): Promise<void> {
  await prisma.scraperRun.update({
    where: { id: runId },
    data: { status, finishedAt: new Date(), ...opts },
  })
}
