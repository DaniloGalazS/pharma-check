import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Badge } from '@/components/ui/badge'
import { PriceTable } from '@/components/medications/price-table'
import { PriceChart } from '@/components/medications/price-chart'
import { FavoriteButton } from '@/components/medications/favorite-button'
import { PriceAlertForm } from '@/components/medications/price-alert-form'
import { Skeleton } from '@/components/ui/skeleton'
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/auth'
import type { Chain } from '@prisma/client'
import type { PriceRow } from '@/components/medications/price-table'
import type { PricePoint } from '@/components/medications/price-chart'

interface Props { params: Promise<{ id: string }> }

async function getMedication(id: string) {
  return prisma.medication.findUnique({
    where: { id },
    include: {
      prices: {
        orderBy: { scrapedAt: 'desc' },
        take: 200,
        include: { pharmacy: true },
      },
    },
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const med = await getMedication(id)
  if (!med) return { title: 'Medicamento no encontrado' }
  return {
    title: med.commercialName ?? med.genericName,
    description: `Compara precios de ${med.genericName} en Cruz Verde, Salcobrand, Ahumada y Dr. Simi.`,
  }
}

export default async function MedicationPage({ params }: Props) {
  const { id } = await params
  const [med, session] = await Promise.all([getMedication(id), auth()])
  if (!med) notFound()

  const userId = session?.user?.id

  // Check if favorited
  const isFavorited = userId
    ? !!(await prisma.favorite.findUnique({
        where: { userId_medicationId: { userId, medicationId: id } },
      }))
    : false

  // Latest price per pharmacy
  const seenPharmacy = new Set<string>()
  const latestPrices: PriceRow[] = []
  for (const p of med.prices) {
    if (seenPharmacy.has(p.pharmacyId)) continue
    seenPharmacy.add(p.pharmacyId)
    latestPrices.push({
      pharmacyId: p.pharmacyId,
      pharmacyName: p.pharmacy.name,
      chain: p.pharmacy.chain as Chain,
      commune: p.pharmacy.commune,
      price: Number(p.price),
      inStock: p.inStock,
      scrapedAt: p.scrapedAt,
    })
  }

  // Historical data for chart (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3_600_000)
  const historicalPrices: PricePoint[] = med.prices
    .filter((p) => p.scrapedAt >= thirtyDaysAgo)
    .map((p) => ({
      date: p.scrapedAt.toISOString().split('T')[0],
      chain: p.pharmacy.chain as Chain,
      price: Number(p.price),
    }))

  const hasData = latestPrices.length > 0
  const minPrice = hasData ? Math.min(...latestPrices.map((p) => p.price)) : undefined

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {med.commercialName ?? med.genericName}
              </h1>
              {med.commercialName && (
                <p className="mt-1 text-lg text-gray-600">{med.genericName}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {med.laboratory   && <Badge variant="default">{med.laboratory}</Badge>}
                {med.presentation && <Badge variant="info">{med.presentation}</Badge>}
                {med.concentration && <Badge variant="default">{med.concentration}</Badge>}
                {med.controlled   && <Badge variant="warning">Controlado</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FavoriteButton
                medicationId={id}
                initialFavorited={isFavorited}
                isLoggedIn={!!userId}
              />
            </div>
          </div>
        </div>

        {!hasData ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 py-16 text-center">
            <p className="text-gray-500">Sin precios disponibles aún.</p>
            <p className="mt-1 text-sm text-gray-400">Los precios se actualizan cada 6 horas.</p>
          </div>
        ) : (
          <>
            {/* Price comparison table */}
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Precios por farmacia</h2>
              <PriceTable rows={latestPrices} />
            </section>

            {/* Price alert */}
            <section className="mb-8">
              <PriceAlertForm
                medicationId={id}
                medicationName={med.commercialName ?? med.genericName}
                currentMinPrice={minPrice}
                isLoggedIn={!!userId}
              />
            </section>

            {/* Price history chart */}
            {historicalPrices.length > 0 && (
              <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Historial de precios (30 días)</h2>
                <Suspense fallback={<Skeleton className="h-[280px] w-full" />}>
                  <PriceChart data={historicalPrices} />
                </Suspense>
              </section>
            )}
          </>
        )}
      </main>
    </>
  )
}
