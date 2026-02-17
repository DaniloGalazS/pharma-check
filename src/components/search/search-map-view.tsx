'use client'

import { useEffect, useState } from 'react'
import { PharmacyMap } from '@/components/map/pharmacy-map'
import type { PharmacyPoint } from '@/components/map/pharmacy-map'
import { useGeolocation } from '@/hooks/use-geolocation'

interface SearchMapViewProps {
  query: string
}

export function SearchMapView({ query }: SearchMapViewProps) {
  const [pharmacies, setPharmacies] = useState<PharmacyPoint[]>([])
  const [loading, setLoading] = useState(false)
  const { state: geoState, request: requestLocation } = useGeolocation()

  useEffect(() => {
    if (!query) return
    setLoading(true)
    fetch(`/api/pharmacies/for-query?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => setPharmacies(data.pharmacies ?? []))
      .finally(() => setLoading(false))
  }, [query])

  return (
    <div>
      {/* Geolocation bar */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading
            ? 'Cargando farmacias…'
            : `${pharmacies.length} farmacias con resultados para "${query}"`}
        </p>
        {geoState.status === 'idle' && (
          <button
            onClick={requestLocation}
            className="flex items-center gap-1.5 text-sm text-emerald-600 hover:underline"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm-7 4H3m18 0h-2M12 3V1m0 22v-2" />
            </svg>
            Usar mi ubicación
          </button>
        )}
        {geoState.status === 'loading' && (
          <span className="text-sm text-gray-400">Obteniendo ubicación…</span>
        )}
        {geoState.status === 'error' && (
          <span className="text-sm text-red-500">{geoState.message}</span>
        )}
      </div>

      <PharmacyMap pharmacies={pharmacies} height={520} />
    </div>
  )
}
