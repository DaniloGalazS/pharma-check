'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import type { Chain } from '@prisma/client'

const CHAIN_COLORS: Record<Chain, string> = {
  CRUZ_VERDE: '#16a34a',
  SALCOBRAND: '#2563eb',
  AHUMADA:   '#ea580c',
  SIMILARES: '#7c3aed',
  OTHER:     '#6b7280',
}

const CHAIN_LABELS: Record<Chain, string> = {
  CRUZ_VERDE: 'Cruz Verde',
  SALCOBRAND: 'Salcobrand',
  AHUMADA:   'Ahumada',
  SIMILARES: 'Dr. Simi',
  OTHER:     'Otra',
}

export interface PricePoint {
  date: string
  chain: Chain
  price: number
}

interface PriceChartProps {
  data: PricePoint[]
}

function formatCLP(v: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v)
}

export function PriceChart({ data }: PriceChartProps) {
  // Pivot: { date, CRUZ_VERDE?: number, SALCOBRAND?: number, ... }
  const chains = [...new Set(data.map((d) => d.chain))] as Chain[]
  const byDate = data.reduce<Record<string, Record<string, number>>>((acc, d) => {
    if (!acc[d.date]) acc[d.date] = {}
    acc[d.date][d.chain] = d.price
    return acc
  }, {})

  const chartData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, prices]) => ({ date, ...prices }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickFormatter={(v: string) => {
            const d = new Date(v)
            return `${d.getDate()}/${d.getMonth() + 1}`
          }}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) =>
            new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(v)
          }
          width={52}
        />
        <Tooltip
          formatter={(value: number | undefined, name: string | undefined) => [
            value !== undefined ? formatCLP(value) : '',
            name ? (CHAIN_LABELS[name as Chain] ?? name) : '',
          ]}
          labelFormatter={(label: unknown) =>
            typeof label === 'string' ? new Date(label).toLocaleDateString('es-CL') : String(label)
          }
        />
        <Legend formatter={(name: string) => CHAIN_LABELS[name as Chain] ?? name} />
        {chains.map((chain) => (
          <Line
            key={chain}
            type="monotone"
            dataKey={chain}
            stroke={CHAIN_COLORS[chain]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
