import webpush from 'web-push'

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL ?? 'admin@pharmacheck.cl'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? '',
)

interface PushPayload {
  title: string
  body: string
  url?: string
}

export async function sendPushNotification(
  subscription: PushSubscriptionJSON,
  payload: PushPayload,
) {
  await webpush.sendNotification(
    subscription as Parameters<typeof webpush.sendNotification>[0],
    JSON.stringify(payload),
  )
}
