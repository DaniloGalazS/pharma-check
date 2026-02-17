'use client'

import { useState } from 'react'

export type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; lat: number; lng: number }
  | { status: 'error'; message: string }

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: 'idle' })

  function request() {
    if (!navigator.geolocation) {
      setState({ status: 'error', message: 'Geolocalización no disponible en este navegador.' })
      return
    }
    setState({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: 'success',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) =>
        setState({
          status: 'error',
          message:
            err.code === err.PERMISSION_DENIED
              ? 'Permiso de ubicación denegado.'
              : 'No se pudo obtener tu ubicación.',
        }),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  function reset() {
    setState({ status: 'idle' })
  }

  return { state, request, reset }
}
