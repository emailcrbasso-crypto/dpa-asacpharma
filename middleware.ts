import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/painel')) {
    if (pathname === '/painel/login') return NextResponse.next()

    const authCookie = request.cookies.get('dpa_auth')?.value
    const expected = Buffer.from(process.env.PAINEL_SECRET ?? '').toString('base64')

    if (!authCookie || authCookie !== expected) {
      return NextResponse.redirect(new URL('/painel/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/painel/:path*'],
}
