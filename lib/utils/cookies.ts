'use server'

import { cookies } from 'next/headers'

export const getCookie = async (name: string | any) => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(name)

  if (cookie) {
    return JSON.parse(cookie.value)
  } else return null
}

export async function setCookie(name: string, value: any) {
  const cookieStore = await cookies()
  cookieStore.set({
    name: name,
    value: JSON.stringify(value),
    httpOnly: true,
    sameSite: 'strict',
  })
}

export const removeCookie = async (name: string = 'token') => {
  const cookieStore = await cookies()
  return cookieStore.delete(name)
}
