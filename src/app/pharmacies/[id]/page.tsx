import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/db/prisma'
import type { Chain } from '@prisma/client'

interface Props { params: Promise<{ id: string }> }

const CHAIN_LABELS: Record<Chain, string> = {
  CRUZ_VERDE: 'Cruz Verde',
  SALCOBRAND: 'Salcobrand',
  AHUMADA: 'Ahumada',
  SIMILARES: 'Dr. Simi',
  OTHER: 'Otra',
}

async function getPharmacy(id: string) {
  return prisma.pharmacy.findUnique({
    where: { id },
    include: {
      prices: {
        orderBy: { scrapedAt: 'desc' },
        take: 100,
        include: {
          medication: {
            select: { id: true, genericName: true, commercialName: true },
          },
        },
      },
    },
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const pharmacy = await getPharmacy(id)
  if (!pharmacy) return { title: 'Farmacia no encontrada' }
  return {
    title: `${CHAIN_LABELS[pharmacy.chain]} ${pharmacy.commune} — ${pharmacy.name}`,
    description: `Precios de medicamentos en ${pharmacy.name}, ${pharmacy.address}, ${pharmacy.commune}.`,
  }
}

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)
}

function timeAgo(date: Date) {
  const diffMs = Date.now() - date.getTime()
  const diffH = Math.floor(diffMs / 3_600_000)
  if (diffH < 1) return 'hace menos de 1 hora'
  if (diffH < 24) return `hace ${diffH}h`
  return `hace ${Math.floor(diffH / 24)}d`
}

export default async function PharmacyPage({ params }: Props) {
  const { id } = await params
  const pharmacy = await getPharmacy(id)
  if (!pharmacy) notFound()

  // Latest price per medication (dedup)
  const seenMed = new Set<string>()
  const latestPrices: {
    medicationId: string
    name: string
    price: number
    inStock: boolean | null
    scrapedAt: Date
  }[] = []
  for (const p of pharmacy.prices) {
    if (seenMed.has(p.medicationId)) continue
    seenMed.add(p.medicationId)
    latestPrices.push({
      medicationId: p.medicationId,
      name: p.medication.commercialName ?? p.medication.genericName,
      price: Number(p.price),
      inStock: p.inStock,
      scrapedAt: p.scrapedAt,
    })
  }

  const mapsUrl =
    pharmacy.latitude != null && pharmacy.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`
      : `https://www.google.com/maps/search/${encodeURIComponent(`${pharmacy.name} ${pharmacy.address} ${pharmacy.commune}`)}`

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back */}
        <Link href="/search" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          ← Volver a resultados
        </Link>

        {/* Header */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge chain={pharmacy.chain}>{CHAIN_LABELS[pharmacy.chain]}</Badge>
                {pharmacy.isOnDuty && (
                  <Badge variant="warning">De Turno</Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{pharmacy.name}</h1>
              <p className="mt-1 text-gray-600">
                {pharmacy.address}, {pharmacy.commune}
              </p>
              <p className="text-sm text-gray-400">{pharmacy.region}</p>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              {pharmacy.phone && (
                <a
                  href={`tel:${pharmacy.phone}`}
                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900"
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {pharmacy.phone}
                </a>
              )}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Cómo llegar
              </a>
            </div>
          </div>
        </div>

        {/* Coordinates */}
        {pharmacy.latitude != null && pharmacy.longitude != null && (
          <p className="mb-6 text-xs text-gray-400">
            GPS: {pharmacy.latitude.toFixed(5)}, {pharmacy.longitude.toFixed(5)}
          </p>
        )}

        {/* Prices */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Medicamentos disponibles{' '}
            <span className="text-sm font-normal text-gray-400">({latestPrices.length})</span>
          </h2>

          {latestPrices.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 py-12 text-center">
              <p className="text-gray-500">Sin precios registrados todavía.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Medicamento
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                      Stock
                    </th>
                    <th className="hidden px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 sm:table-cell">
                      Actualizado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {latestPrices.map((p) => (
                    <tr key={p.medicationId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/medications/${p.medicationId}`}
                          className="text-sm font-medium text-gray-900 hover:text-emerald-600 hover:underline"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">
                        {formatCLP(p.price)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.inStock === false ? (
                          <span className="text-xs text-red-500">Sin stock</span>
                        ) : p.inStock === true ? (
                          <span className="text-xs text-green-600">Disponible</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-right text-xs text-gray-400 sm:table-cell">
                        {timeAgo(p.scrapedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  )
}
