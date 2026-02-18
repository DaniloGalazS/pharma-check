import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isProtected = req.nextUrl.pathname.startsWith('/profile') ||
    req.nextUrl.pathname.startsWith('/alerts') ||
    req.nextUrl.pathname.startsWith('/favorites')

  if (isProtected && !req.auth) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(req.nextUrl.pathname)}`, req.url),
    )
  }
})

export const config = {
  matcher: ['/profile/:path*', '/alerts/:path*', '/favorites/:path*'],
}
