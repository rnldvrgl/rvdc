import { cookies } from 'next/headers'
import { getToken } from './tokens'

export const getCookieToken = async (): Promise<any> => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('csrftoken')

  if (cookie) {
    return cookie
  } else return null
}

export async function setCookieToken() {
  'use server'
  const cookieStore = await cookies()
  cookieStore.set('token', getToken()!.toString() || 'null')
}
