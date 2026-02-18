'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Chain } from '@prisma/client'

const CHAIN_LABELS: Record<Chain, string> = {
  CRUZ_VERDE: 'Cruz Verde', SALCOBRAND: 'Salcobrand',
  AHUMADA: 'Ahumada', SIMILARES: 'Dr. Simi', OTHER: 'Otra',
}

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
}

interface Alert {
  id: string
  medicationId: string
  medicationName: string
  targetPrice: number
  chain: Chain | null
  active: boolean
  createdAt: string
}

export function AlertsClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState(initialAlerts)

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active } : a)))
  }

  async function deleteAlert(id: string) {
    await fetch(`/api/alerts/${id}`, { method: 'DELETE' })
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-center gap-4 rounded-xl border p-4 transition-opacity ${
            alert.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
          }`}
        >
          <div className="flex-1 min-w-0">
            <Link href={`/medications/${alert.medicationId}`} className="font-semibold text-gray-900 hover:text-emerald-600 hover:underline truncate block">
              {alert.medicationName}
            </Link>
            <p className="mt-0.5 text-sm text-gray-500">
              Alerta si baja de{' '}
              <span className="font-semibold text-emerald-700">{formatCLP(alert.targetPrice)}</span>
              {alert.chain && ` · Solo en ${CHAIN_LABELS[alert.chain]}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleActive(alert.id, !alert.active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                alert.active ? 'bg-emerald-600' : 'bg-gray-200'
              }`}
              title={alert.active ? 'Desactivar alerta' : 'Activar alerta'}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                alert.active ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <button
              onClick={() => deleteAlert(alert.id)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
              title="Eliminar alerta"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
