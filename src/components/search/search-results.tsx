import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Chain } from '@prisma/client'

const CHAIN_LABELS: Record<Chain, string> = {
  CRUZ_VERDE: 'Cruz Verde', SALCOBRAND: 'Salcobrand',
  AHUMADA: 'Ahumada', SIMILARES: 'Dr. Simi', OTHER: 'Otra',
}

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
}

interface SearchResultsProps {
  query: string
  page: number
  lab?: string
  presentation?: string
}

async function fetchResults(query: string, page: number, lab?: string, presentation?: string) {
  const params = new URLSearchParams({ q: query, page: String(page) })
  if (lab) params.set('lab', lab)
  if (presentation) params.set('presentation', presentation)
  const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/medications/search?${params}`, { cache: 'no-store' })
  if (!res.ok) return { medications: [], total: 0, page, pageSize: 10 }
  return res.json()
}

export async function SearchResults({ query, page, lab, presentation }: SearchResultsProps) {
  const { medications, total, pageSize } = await fetchResults(query, page, lab, presentation)

  if (medications.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-xl font-medium text-gray-700">Sin resultados para &ldquo;{query}&rdquo;</p>
        <p className="mt-2 text-sm text-gray-500">Intenta con el nombre genérico o el principio activo.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">{total} resultados para &ldquo;{query}&rdquo;</p>

      <div className="space-y-4">
        {medications.map((med: {
          id: string
          genericName: string
          commercialName: string | null
          laboratory: string | null
          presentation: string | null
          prices: { price: number; pharmacy: { chain: Chain } }[]
        }) => {
          const prices = med.prices.map((p: { price: number }) => Number(p.price))
          const minPrice = prices.length ? Math.min(...prices) : null
          const chains = [...new Set(med.prices.map((p: { pharmacy: { chain: Chain } }) => p.pharmacy.chain))] as Chain[]

          return (
            <Link key={med.id} href={`/medications/${med.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-gray-900">
                      {med.commercialName ?? med.genericName}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {med.genericName}
                      {med.laboratory && ` · ${med.laboratory}`}
                      {med.presentation && ` · ${med.presentation}`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {chains.map((c) => (
                        <Badge key={c} chain={c}>{CHAIN_LABELS[c]}</Badge>
                      ))}
                    </div>
                  </div>
                  {minPrice !== null && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">desde</p>
                      <p className="text-xl font-bold text-emerald-700">{formatCLP(minPrice)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              ← Anterior
            </Link>
          )}
          {page * pageSize < total && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Siguiente →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
