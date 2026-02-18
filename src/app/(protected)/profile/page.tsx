import type { Metadata } from 'next'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { PushPermission } from '@/components/push/push-permission'

export const metadata: Metadata = { title: 'Mi perfil' }

export default async function ProfilePage() {
  const session = await auth()
  const user = session!.user

  const [favoritesCount, alertsCount, historyCount] = await Promise.all([
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.priceAlert.count({ where: { userId: user.id, active: true } }),
    prisma.searchHistory.count({ where: { userId: user.id } }),
  ])

  const stats = [
    { label: 'Favoritos', value: favoritesCount, href: '/favorites' },
    { label: 'Alertas activas', value: alertsCount, href: '/alerts' },
    { label: 'Búsquedas', value: historyCount, href: '#' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
      </div>

      {/* User card */}
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6">
        {user.image ? (
          <img src={user.image} alt={user.name ?? ''} className="h-16 w-16 rounded-full" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
            {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div>
          <p className="text-lg font-semibold text-gray-900">{user.name ?? 'Sin nombre'}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl border border-gray-200 bg-white p-5 text-center hover:shadow-md transition-shadow">
            <p className="text-3xl font-bold text-emerald-700">{s.value}</p>
            <p className="mt-1 text-sm text-gray-500">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Push notifications */}
      <PushPermission />

      {/* Quick links */}
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        {[
          { href: '/favorites', label: 'Mis medicamentos favoritos', icon: '❤️' },
          { href: '/alerts', label: 'Mis alertas de precio', icon: '🔔' },
          { href: '/search', label: 'Buscar medicamentos', icon: '🔍' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50">
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            <svg className="ml-auto h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}
