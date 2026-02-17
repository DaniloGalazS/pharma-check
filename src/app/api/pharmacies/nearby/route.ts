import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { haversineKm } from '@/lib/utils/haversine'

export const runtime = 'nodejs'

/**
 * GET /api/pharmacies/nearby
 *
 * Query params:
 *   lat, lng         – user coordinates (required for distance sorting)
 *   radiusKm         – max distance in km (default 5)
 *   medicationId     – include latest price for this medication
 *   limit            – max results (default 50)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')
  const radiusKm = parseFloat(searchParams.get('radiusKm') ?? '5')
  const medicationId = searchParams.get('medicationId') ?? undefined
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)

  const hasCoords = !isNaN(lat) && !isNaN(lng)

  // Fetch pharmacies with coordinates
  const pharmacies = await prisma.pharmacy.findMany({
    where: {
      isOnDuty: undefined,
      latitude: { not: null },
      longitude: { not: null },
    },
    include: medicationId
      ? {
          prices: {
            where: { medicationId },
            orderBy: { scrapedAt: 'desc' },
            take: 1,
          },
        }
      : undefined,
    take: hasCoords ? 2000 : limit, // fetch more to filter by radius
  })

  // Calculate distances and filter by radius when coords provided
  type PharmacyWithDistance = (typeof pharmacies)[number] & { distanceKm?: number }

  let results: PharmacyWithDistance[] = pharmacies.map((p) => ({
    ...p,
    distanceKm:
      hasCoords && p.latitude != null && p.longitude != null
        ? haversineKm(lat, lng, p.latitude, p.longitude)
        : undefined,
  }))

  if (hasCoords) {
    results = results
      .filter((p) => p.distanceKm !== undefined && p.distanceKm <= radiusKm)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
      .slice(0, limit)
  }

  const payload = results.map((p) => ({
    id: p.id,
    name: p.name,
    chain: p.chain,
    address: p.address,
    commune: p.commune,
    region: p.region,
    phone: p.phone,
    latitude: p.latitude,
    longitude: p.longitude,
    isOnDuty: p.isOnDuty,
    distanceKm: p.distanceKm != null ? Math.round(p.distanceKm * 10) / 10 : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    price: medicationId ? (Number((p as any).prices?.[0]?.price) || undefined) : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inStock: medicationId ? ((p as any).prices?.[0]?.inStock ?? undefined) : undefined,
  }))

  return NextResponse.json({ pharmacies: payload })
}
