import Link from 'next/link'
import { auth, signOut } from '@/auth'

export async function Navbar() {
  const session = await auth()
  const user = session?.user

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-emerald-600">💊</span>
          <span className="text-lg font-bold text-gray-900">PharmaCheck</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:block"
          >
            Buscar
          </Link>

          {user ? (
            <>
              <Link
                href="/favorites"
                className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:block"
              >
                Favoritos
              </Link>
              <Link
                href="/alerts"
                className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:block"
              >
                Alertas
              </Link>
              <Link href="/profile" className="flex items-center gap-2">
                {user.image ? (
                  <img src={user.image} alt={user.name ?? ''} className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                    {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
              </Link>
              <form
                action={async () => {
                  'use server'
                  await signOut({ redirectTo: '/' })
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                Ingresar
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
