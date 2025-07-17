import { NextRequest, NextResponse } from 'next/server'

export default function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl
  const token = request.cookies.get('tokens')?.value

  const redirect = (path: string) => NextResponse.redirect(`${origin}${path}`)

  if (!token && pathname !== '/') {
    return redirect('/')
  }

  if (token && pathname === '/') {
    return redirect('/dashboard')
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/((?!api|_next|.*\\..*).*)'],
}
