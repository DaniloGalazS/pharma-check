'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Chain } from '@prisma/client'

const CHAINS: { value: Chain | ''; label: string }[] = [
  { value: '', label: 'Cualquier farmacia' },
  { value: 'CRUZ_VERDE', label: 'Cruz Verde' },
  { value: 'SALCOBRAND', label: 'Salcobrand' },
  { value: 'AHUMADA', label: 'Ahumada' },
  { value: 'SIMILARES', label: 'Dr. Simi' },
]

interface PriceAlertFormProps {
  medicationId: string
  medicationName: string
  currentMinPrice?: number
  isLoggedIn: boolean
}

export function PriceAlertForm({ medicationId, medicationName, currentMinPrice, isLoggedIn }: PriceAlertFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [targetPrice, setTargetPrice] = useState(currentMinPrice ? Math.round(currentMinPrice * 0.9).toString() : '')
  const [chain, setChain] = useState<Chain | ''>('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoggedIn) { router.push('/login'); return }

    setLoading(true)
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medicationId,
        targetPrice: Number(targetPrice),
        chain: chain || null,
      }),
    })
    setLoading(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => { setOpen(false); setSaved(false) }, 1500)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => isLoggedIn ? setOpen(true) : router.push('/login')}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Crear alerta
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">
        Alerta para <span className="text-emerald-700">{medicationName}</span>
      </h3>
      {saved ? (
        <p className="text-sm font-medium text-emerald-700">✓ Alerta creada correctamente</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Precio objetivo (CLP)</label>
            <input
              type="number" required min={1} value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Ej: 5000"
            />
            {currentMinPrice && (
              <p className="mt-1 text-xs text-gray-400">Precio actual más bajo: ${currentMinPrice.toLocaleString('es-CL')}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Farmacia (opcional)</label>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value as Chain | '')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              {CHAINS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? 'Guardando…' : 'Guardar alerta'}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
