import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { AlertsClient } from '@/components/medications/alerts-client'

export const metadata: Metadata = { title: 'Mis alertas de precio' }

export default async function AlertsPage() {
  const session = await auth()

  const alerts = await prisma.priceAlert.findMany({
    where: { userId: session!.user.id },
    include: {
      medication: { select: { id: true, genericName: true, commercialName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Mis alertas de precio <span className="text-lg font-normal text-gray-400">({alerts.length})</span>
      </h1>

      {alerts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-gray-500">Aún no tienes alertas de precio.</p>
          <p className="mt-1 text-sm text-gray-400">
            En la página de un medicamento puedes crear alertas para recibir notificaciones cuando baje el precio.
          </p>
          <Link href="/search" className="mt-3 inline-block text-sm font-medium text-emerald-600 hover:underline">
            Buscar medicamentos →
          </Link>
        </div>
      ) : (
        <AlertsClient initialAlerts={alerts.map((a) => ({
          id: a.id,
          medicationId: a.medicationId,
          medicationName: a.medication.commercialName ?? a.medication.genericName,
          targetPrice: Number(a.targetPrice),
          chain: a.chain,
          active: a.active,
          createdAt: a.createdAt.toISOString(),
        }))} />
      )}
    </div>
  )
}
