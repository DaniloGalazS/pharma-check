'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FavoriteButtonProps {
  medicationId: string
  initialFavorited: boolean
  isLoggedIn: boolean
}

export function FavoriteButton({ medicationId, initialFavorited, isLoggedIn }: FavoriteButtonProps) {
  const router = useRouter()
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    setLoading(true)
    if (favorited) {
      await fetch(`/api/favorites/${medicationId}`, { method: 'DELETE' })
      setFavorited(false)
    } else {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicationId }),
      })
      setFavorited(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={favorited ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50"
    >
      <svg
        className={`h-5 w-5 transition-colors ${favorited ? 'fill-red-500 text-red-500' : 'fill-none text-gray-400'}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      {favorited ? 'Guardado' : 'Guardar'}
    </button>
  )
}
