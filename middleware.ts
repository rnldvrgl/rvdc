import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const publicPaths = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get('token')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value
  const isAuthenticated = !!(token || refreshToken)

  // If trying to access login/register while already logged in, redirect to dashboard
  if (
    publicPaths.some((path) => pathname.startsWith(path)) &&
    isAuthenticated
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If trying to access a protected page without being logged in
  if (
    !publicPaths.some((path) => pathname.startsWith(path)) &&
    !isAuthenticated
  ) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname) // optional: redirect back after login
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth/token).*)'],
}
