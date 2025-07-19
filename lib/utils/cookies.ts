'use server'

import { cookies } from 'next/headers'

export const getCookie = async (name: string): Promise<string | null> => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(name)

  if (cookie) {
    return cookie.value
  } else return null
}

export async function setCookie(name: string, token: string, expires?: number) {
  const cookieStore = await cookies()
  cookieStore.set({
    name: name,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(Date.now() + (expires || 60 * 60 * 24 * 7) * 1000),
  })
}

export async function deleteCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('tokens')
}
