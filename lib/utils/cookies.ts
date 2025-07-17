'use server'

import { Token } from '@/lib/constants/types'
import { cookies } from 'next/headers'

export const getCookie = async (): Promise<Token | null> => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('tokens')

  if (cookie) {
    return JSON.parse(cookie.value)
  } else return null
}

export async function setCookie(token: Token) {
  const cookieStore = await cookies()
  cookieStore.set({
    name: 'tokens',
    value: JSON.stringify(token),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })
}

export async function deleteCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('tokens')
}
