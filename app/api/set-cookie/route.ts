import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { access, refresh } = await req.json()

  const res = NextResponse.json({ message: 'Cookie set' })

  res.cookies.set({
    name: 'tokens',
    value: JSON.stringify({ access, refresh }),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  return res
}
