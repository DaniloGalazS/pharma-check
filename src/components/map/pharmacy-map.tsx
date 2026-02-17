'use client'

import { useState, useCallback } from 'react'
import Map, { Marker, Popup, GeolocateControl, NavigationControl } from 'react-map-gl/mapbox'
import type { Chain } from '@prisma/client'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

// Santiago de Chile default center
const DEFAULT_CENTER = { latitude: -33.4569, longitude: -70.6483, zoom: 12 }

const CHAIN_COLORS: Record<Chain, string> = {
  CRUZ_VERDE: '#16a34a',
  SALCOBRAND: '#2563eb',
  AHUMADA: '#ea580c',
  SIMILARES: '#7c3aed',
  OTHER: '#6b7280',
}

const CHAIN_LABELS: Record<Chain, string> = {
  CRUZ_VERDE: 'Cruz Verde',
  SALCOBRAND: 'Salcobrand',
  AHUMADA: 'Ahumada',
  SIMILARES: 'Dr. Simi',
  OTHER: 'Otra',
}

export interface PharmacyPoint {
  id: string
  name: string
  chain: Chain
  address: string
  commune: string
  latitude: number
  longitude: number
  isOnDuty?: boolean
  price?: number
  medicationName?: string
  inStock?: boolean | null
  distanceKm?: number
}

interface PharmacyMapProps {
  pharmacies: PharmacyPoint[]
  height?: number
}

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)
}

function ChainDot({ chain }: { chain: Chain }) {
  return (
    <div
      style={{ backgroundColor: CHAIN_COLORS[chain] }}
      className="h-4 w-4 rounded-full border-2 border-white shadow"
    />
  )
}

export function PharmacyMap({ pharmacies, height = 480 }: PharmacyMapProps) {
  const [selected, setSelected] = useState<PharmacyPoint | null>(null)

  const handleMarkerClick = useCallback(
    (e: { originalEvent: MouseEvent }, pharmacy: PharmacyPoint) => {
      e.originalEvent.stopPropagation()
      setSelected(pharmacy)
    },
    [],
  )

  if (!MAPBOX_TOKEN) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center"
      >
        <p className="text-sm font-medium text-gray-600">Mapa no disponible</p>
        <p className="mt-1 text-xs text-gray-400">
          Agrega <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> al
          archivo .env para activar el mapa.
        </p>
      </div>
    )
  }

  return (
    <div style={{ height }} className="overflow-hidden rounded-xl border border-gray-200">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={DEFAULT_CENTER}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onClick={() => setSelected(null)}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" trackUserLocation />

        {pharmacies.map((pharmacy) => (
          <Marker
            key={pharmacy.id}
            latitude={pharmacy.latitude}
            longitude={pharmacy.longitude}
            anchor="center"
            onClick={(e) => handleMarkerClick(e, pharmacy)}
          >
            <div className="cursor-pointer transition-transform hover:scale-125">
              <ChainDot chain={pharmacy.chain} />
            </div>
          </Marker>
        ))}

        {selected && (
          <Popup
            latitude={selected.latitude}
            longitude={selected.longitude}
            anchor="bottom"
            offset={12}
            onClose={() => setSelected(null)}
            closeButton
            closeOnClick={false}
            maxWidth="240px"
          >
            <div className="p-1 text-sm">
              <div className="mb-1 flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: CHAIN_COLORS[selected.chain] }}
                />
                <span className="font-semibold text-gray-900">
                  {CHAIN_LABELS[selected.chain]}
                </span>
                {selected.isOnDuty && (
                  <span className="rounded bg-amber-100 px-1 text-xs text-amber-700">Turno</span>
                )}
              </div>
              <p className="text-gray-700">{selected.name}</p>
              <p className="text-xs text-gray-500">
                {selected.address}, {selected.commune}
              </p>
              {selected.medicationName && (
                <p className="mt-1 text-xs text-gray-500">{selected.medicationName}</p>
              )}
              {selected.price != null && (
                <p className="mt-1 font-bold text-emerald-700">{formatCLP(selected.price)}</p>
              )}
              {selected.inStock === false && (
                <p className="text-xs text-red-500">Sin stock</p>
              )}
              {selected.distanceKm != null && (
                <p className="mt-0.5 text-xs text-gray-400">{selected.distanceKm} km</p>
              )}
              <a
                href={`/pharmacies/${selected.id}`}
                className="mt-2 block text-xs font-medium text-emerald-600 hover:underline"
              >
                Ver detalle →
              </a>
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 rounded-lg border border-gray-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {(Object.entries(CHAIN_LABELS) as [Chain, string][]).map(([chain, label]) => (
            <div key={chain} className="flex items-center gap-1 text-xs text-gray-700">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: CHAIN_COLORS[chain] }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
