import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { sendPriceAlertEmail } from '@/lib/email/resend'
import { sendPushNotification } from '@/lib/push/send'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const alerts = await prisma.priceAlert.findMany({
    where: { active: true },
    include: {
      user: { select: { id: true, email: true, name: true, pushSubscription: true } },
      medication: { select: { id: true, genericName: true, commercialName: true } },
    },
  })

  let fired = 0

  for (const alert of alerts) {
    // Find the lowest current price matching the alert's chain filter
    const latestPrice = await prisma.price.findFirst({
      where: {
        medicationId: alert.medicationId,
        ...(alert.chain && { pharmacy: { chain: alert.chain } }),
        price: { lte: alert.targetPrice },
      },
      orderBy: { price: 'asc' },
      include: { pharmacy: { select: { name: true, chain: true } } },
    })

    if (!latestPrice) continue

    // Avoid spam: skip if notified in the last 24h
    if (alert.lastNotified && Date.now() - alert.lastNotified.getTime() < 24 * 3_600_000) continue

    const medName = alert.medication.commercialName ?? alert.medication.genericName

    // Send email
    if (alert.user.email) {
      try {
        await sendPriceAlertEmail({
          to: alert.user.email,
          userName: alert.user.name ?? 'Usuario',
          medicationName: medName,
          medicationId: alert.medicationId,
          pharmacyName: latestPrice.pharmacy.name,
          chainName: latestPrice.pharmacy.chain,
          currentPrice: Number(latestPrice.price),
          targetPrice: Number(alert.targetPrice),
        })
      } catch (err) {
        console.error('Email error:', err)
      }
    }

    // Send web push if subscription exists
    if (alert.user.pushSubscription) {
      try {
        await sendPushNotification(
          alert.user.pushSubscription as PushSubscriptionJSON,
          {
            title: `💊 ${medName} bajó de precio`,
            body: `Ahora desde $${Number(latestPrice.price).toLocaleString('es-CL')} en ${latestPrice.pharmacy.name}`,
            url: `/medications/${alert.medicationId}`,
          },
        )
      } catch (err) {
        console.error('Push error:', err)
      }
    }

    await prisma.priceAlert.update({
      where: { id: alert.id },
      data: { lastNotified: new Date() },
    })
    fired++
  }

  return NextResponse.json({ fired, total: alerts.length })
}
