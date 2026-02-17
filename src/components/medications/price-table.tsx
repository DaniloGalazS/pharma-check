'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import type { Chain } from '@prisma/client'
import { ArrowUp, ArrowDown } from 'lucide-react'

const CHAIN_LABELS: Record<Chain, string> = {
  CRUZ_VERDE: 'Cruz Verde',
  SALCOBRAND: 'Salcobrand',
  AHUMADA: 'Ahumada',
  SIMILARES: 'Dr. Simi',
  OTHER: 'Otra',
}

export interface PriceRow {
  pharmacyId: string
  pharmacyName: string
  chain: Chain
  commune: string
  price: number
  inStock: boolean | null
  scrapedAt: Date | string
}

interface PriceTableProps {
  rows: PriceRow[]
  className?: string
}

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount)
}

function formatAge(date: Date | string): string {
  const d = new Date(date)
  const diffH = Math.floor((Date.now() - d.getTime()) / 3_600_000)
  if (diffH < 1) return 'hace menos de 1h'
  if (diffH < 24) return `hace ${diffH}h`
  return `hace ${Math.floor(diffH / 24)}d`
}

export function PriceTable({ rows, className }: PriceTableProps) {
  const [sortAsc, setSortAsc] = useState(true)
  const sorted = [...rows].sort((a, b) => sortAsc ? a.price - b.price : b.price - a.price)
  const minPrice = Math.min(...rows.map((r) => r.price))

  return (
    <div className={cn('overflow-hidden rounded-xl border border-gray-200', className)}>
      {/* Desktop table */}
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Farmacia</th>
            <th className="px-4 py-3">Cadena</th>
            <th className="px-4 py-3">Comuna</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="flex items-center gap-1 hover:text-gray-700"
                aria-label="Ordenar por precio"
              >
                Precio
                {sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              </button>
            </th>
            <th className="px-4 py-3">Actualizado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((row, i) => (
            <tr
              key={`${row.pharmacyId}-${i}`}
              className={cn(
                'transition-colors hover:bg-gray-50',
                row.price === minPrice && 'bg-emerald-50 hover:bg-emerald-100/70'
              )}
            >
              <td className="px-4 py-3 font-medium text-gray-900">
                {row.pharmacyName}
                {row.price === minPrice && (
                  <span className="ml-2 text-xs font-semibold text-emerald-600">★ Más barato</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge chain={row.chain}>{CHAIN_LABELS[row.chain]}</Badge>
              </td>
              <td className="px-4 py-3 text-gray-600">{row.commune}</td>
              <td className="px-4 py-3">
                {row.inStock === null ? (
                  <span className="text-gray-400">—</span>
                ) : row.inStock ? (
                  <Badge variant="success">Disponible</Badge>
                ) : (
                  <Badge variant="danger">Sin stock</Badge>
                )}
              </td>
              <td className="px-4 py-3 font-semibold text-gray-900">{formatCLP(row.price)}</td>
              <td className="px-4 py-3 text-xs text-gray-400">{formatAge(row.scrapedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="divide-y divide-gray-100 md:hidden">
        {sorted.map((row, i) => (
          <div
            key={`mob-${row.pharmacyId}-${i}`}
            className={cn(
              'flex items-center justify-between px-4 py-3',
              row.price === minPrice && 'bg-emerald-50'
            )}
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">{row.pharmacyName}</p>
              <p className="text-xs text-gray-500">{CHAIN_LABELS[row.chain]} · {row.commune}</p>
            </div>
            <div className="ml-4 text-right">
              <p className={cn('font-semibold', row.price === minPrice ? 'text-emerald-700' : 'text-gray-900')}>
                {formatCLP(row.price)}
              </p>
              <p className="text-xs text-gray-400">{formatAge(row.scrapedAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
