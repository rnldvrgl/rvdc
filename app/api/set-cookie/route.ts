import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  console.log('API: /api/set-cookie called')
  const { access, refresh } = await req.json()

  console.log('RECEIVED TOKENS', { access, refresh })

  const response = NextResponse.json({ message: 'Cookie set' })

  response.cookies.set('access', access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
  })

  response.cookies.set('refresh', refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })

  return response
}
