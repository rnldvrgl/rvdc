import { getCookie } from '@/lib/utils/cookies'
import { NextRequest, NextResponse } from 'next/server'

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const token = await getCookie('access')

  // If user is NOT logged in (no access token)
  // and trying to visit any route EXCEPT the login page "/",
  // redirect them back to "/"
  if (!token && path !== '/') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ['/', '/((?!api|_next|.*\\..*).*)'],
}
