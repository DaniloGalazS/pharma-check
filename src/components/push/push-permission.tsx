'use client'

import { useEffect, useState } from 'react'

export function PushPermission() {
  const [state, setState] = useState<'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'>('idle')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'granted') setState('granted')
    else if (Notification.permission === 'denied') setState('denied')
  }, [])

  async function subscribe() {
    setState('loading')
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
        ),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      setState('granted')
    } catch {
      setState('denied')
    }
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js')
    const sub = await reg?.pushManager.getSubscription()
    await sub?.unsubscribe()
    await fetch('/api/push/subscribe', { method: 'DELETE' })
    setState('idle')
  }

  if (state === 'unsupported') return null

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <p className="text-sm font-medium text-gray-900">Notificaciones push</p>
        <p className="text-xs text-gray-500">Recibe alertas aunque no tengas la app abierta</p>
      </div>
      {state === 'granted' ? (
        <button onClick={unsubscribe} className="text-sm text-red-500 hover:underline">
          Desactivar
        </button>
      ) : state === 'denied' ? (
        <span className="text-xs text-gray-400">Bloqueadas por el browser</span>
      ) : (
        <button
          onClick={subscribe}
          disabled={state === 'loading'}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {state === 'loading' ? 'Activando…' : 'Activar'}
        </button>
      )}
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}
