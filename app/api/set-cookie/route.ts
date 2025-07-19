import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  console.log('API: /api/set-cookie called')

  try {
    const { access, refresh } = await req.json()
    console.log('RECEIVED TOKENS', { access, refresh })

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
  } catch (error) {
    console.error('API ERROR in set-cookie:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
