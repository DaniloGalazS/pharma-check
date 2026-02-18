import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { Badge } from '@/components/ui/badge'
import type { Chain } from '@prisma/client'

export const metadata: Metadata = { title: 'Mis favoritos' }

const CHAIN_LABELS: Record<Chain, string> = {
  CRUZ_VERDE: 'Cruz Verde', SALCOBRAND: 'Salcobrand',
  AHUMADA: 'Ahumada', SIMILARES: 'Dr. Simi', OTHER: 'Otra',
}

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
}

export default async function FavoritesPage() {
  const session = await auth()

  const favorites = await prisma.favorite.findMany({
    where: { userId: session!.user.id },
    include: {
      medication: {
        include: {
          prices: {
            orderBy: { scrapedAt: 'desc' },
            take: 10,
            include: { pharmacy: { select: { chain: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Mis favoritos <span className="text-lg font-normal text-gray-400">({favorites.length})</span>
      </h1>

      {favorites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-gray-500">Aún no tienes favoritos.</p>
          <Link href="/search" className="mt-3 inline-block text-sm font-medium text-emerald-600 hover:underline">
            Buscar medicamentos →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map(({ medication }) => {
            const prices = medication.prices.map((p) => Number(p.price))
            const minPrice = prices.length ? Math.min(...prices) : null
            const chains = [...new Set(medication.prices.map((p) => p.pharmacy.chain))] as Chain[]

            return (
              <Link key={medication.id} href={`/medications/${medication.id}`}>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">
                      {medication.commercialName ?? medication.genericName}
                    </p>
                    <p className="text-sm text-gray-500">{medication.genericName}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {chains.map((c) => <Badge key={c} chain={c}>{CHAIN_LABELS[c]}</Badge>)}
                    </div>
                  </div>
                  {minPrice !== null && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">desde</p>
                      <p className="text-xl font-bold text-emerald-700">{formatCLP(minPrice)}</p>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
