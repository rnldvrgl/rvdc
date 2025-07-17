import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ message: 'Cookie deleted' })
  res.cookies.delete('tokens')
  return res
}
