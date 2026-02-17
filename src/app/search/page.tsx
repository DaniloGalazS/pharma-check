import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { SearchBox } from '@/components/search/search-box'
import { SearchResults } from '@/components/search/search-results'

interface Props {
  searchParams: Promise<{ q?: string; page?: string; lab?: string; presentation?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `"${q}" — Resultados` : 'Buscar medicamentos',
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', page = '1', lab, presentation } = await searchParams

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search bar */}
        <div className="mb-8">
          <SearchBox initialQuery={q} className="max-w-2xl" />
        </div>

        {q ? (
          <SearchResults
            query={q}
            page={parseInt(page)}
            lab={lab}
            presentation={presentation}
          />
        ) : (
          <p className="text-center text-gray-500">Escribe un medicamento para comenzar.</p>
        )}
      </main>
    </>
  )
}
