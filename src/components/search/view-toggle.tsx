'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface ViewToggleProps {
  current: 'list' | 'map'
}

export function ViewToggle({ current }: ViewToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const setView = useCallback(
    (view: 'list' | 'map') => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('view', view)
      router.push(`/search?${params.toString()}`)
    },
    [router, searchParams],
  )

  return (
    <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white">
      <button
        onClick={() => setView('list')}
        aria-pressed={current === 'list'}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
          current === 'list'
            ? 'bg-emerald-600 text-white'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        Lista
      </button>
      <button
        onClick={() => setView('map')}
        aria-pressed={current === 'map'}
        className={`flex items-center gap-1.5 border-l border-gray-200 px-3 py-1.5 text-sm font-medium transition-colors ${
          current === 'map'
            ? 'bg-emerald-600 text-white'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Mapa
      </button>
    </div>
  )
}
