import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const runtime = 'nodejs'

/**
 * GET /api/pharmacies/for-query?q=aspirin
 *
 * Returns pharmacies with coordinates that have prices for medications
 * matching the search query. Used by the search map view.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json({ pharmacies: [] })

  // Find medications matching the query
  const medications = await prisma.medication.findMany({
    where: {
      OR: [
        { genericName: { contains: q, mode: 'insensitive' } },
        { commercialName: { contains: q, mode: 'insensitive' } },
        { activePrinciple: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true },
    take: 20,
  })

  if (medications.length === 0) return NextResponse.json({ pharmacies: [] })

  const medicationIds = medications.map((m) => m.id)

  // Get pharmacies with prices for these medications
  const prices = await prisma.price.findMany({
    where: { medicationId: { in: medicationIds } },
    orderBy: { scrapedAt: 'desc' },
    take: 500,
    include: {
      pharmacy: true,
      medication: { select: { genericName: true, commercialName: true } },
    },
  })

  // Deduplicate: keep cheapest price per pharmacy
  const byPharmacy = new Map<
    string,
    { price: number; medicationName: string; inStock: boolean | null }
  >()
  for (const p of prices) {
    if (p.pharmacy.latitude == null || p.pharmacy.longitude == null) continue
    const existing = byPharmacy.get(p.pharmacyId)
    const amount = Number(p.price)
    if (!existing || amount < existing.price) {
      byPharmacy.set(p.pharmacyId, {
        price: amount,
        medicationName: p.medication.commercialName ?? p.medication.genericName,
        inStock: p.inStock,
      })
    }
  }

  // Build pharmacy list
  const pharmacyMap = new Map(prices.map((p) => [p.pharmacyId, p.pharmacy]))
  const pharmacies = Array.from(byPharmacy.entries()).map(([pharmacyId, data]) => {
    const ph = pharmacyMap.get(pharmacyId)!
    return {
      id: ph.id,
      name: ph.name,
      chain: ph.chain,
      address: ph.address,
      commune: ph.commune,
      region: ph.region,
      phone: ph.phone,
      latitude: ph.latitude,
      longitude: ph.longitude,
      isOnDuty: ph.isOnDuty,
      price: data.price,
      medicationName: data.medicationName,
      inStock: data.inStock,
    }
  })

  return NextResponse.json({ pharmacies })
}
