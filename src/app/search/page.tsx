import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { SearchBox } from '@/components/search/search-box'
import { SearchResults } from '@/components/search/search-results'
import { SearchMapView } from '@/components/search/search-map-view'
import { ViewToggle } from '@/components/search/view-toggle'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  searchParams: Promise<{
    q?: string
    page?: string
    lab?: string
    presentation?: string
    view?: string
  }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `"${q}" — Resultados` : 'Buscar medicamentos',
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', page = '1', lab, presentation, view = 'list' } = await searchParams
  const isMapView = view === 'map'

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search bar + view toggle */}
        <div className="mb-8 flex flex-wrap items-end gap-3">
          <SearchBox initialQuery={q} className="max-w-2xl flex-1" />
          {q && (
            <Suspense>
              <ViewToggle current={isMapView ? 'map' : 'list'} />
            </Suspense>
          )}
        </div>

        {q ? (
          isMapView ? (
            <SearchMapView query={q} />
          ) : (
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <SearchResults
                query={q}
                page={parseInt(page)}
                lab={lab}
                presentation={presentation}
              />
            </Suspense>
          )
        ) : (
          <p className="text-center text-gray-500">Escribe un medicamento para comenzar.</p>
        )}
      </main>
    </>
  )
}
