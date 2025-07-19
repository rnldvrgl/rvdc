import { NextRequest, NextResponse } from 'next/server'

export default function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl
  const access = request.cookies.get('access')?.value

  const redirect = (path: string) => NextResponse.redirect(`${origin}${path}`)

  if (!access && pathname !== '/') {
    return redirect('/')
  }

  if (access && pathname === '/') {
    return redirect('/dashboard')
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/((?!api|_next|.*\\..*).*)'],
}
