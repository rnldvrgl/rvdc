import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  console.log('API: /api/set-cookie called')
  const cookieStore = await cookies()
  const { access, refresh } = await req.json()

  if (cookieStore.has('tokens')) {
    return NextResponse.json({ error: 'Cookie already set' }, { status: 400 })
  }

  console.log('RECEIVED TOKENS', { access, refresh })

  cookieStore.set('access', access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60,
  })

  cookieStore.set('refresh', refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  })

  return NextResponse.json({ message: 'Cookie set' })
}
