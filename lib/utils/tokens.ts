export const getToken = (key: string) => {
  if (typeof window === 'undefined') return null

  try {
    const tokenStr = localStorage.getItem(key)
    if (!tokenStr) return null

    const token = JSON.parse(tokenStr)
    if (token) {
      return token
    }

    return null
  } catch (error) {
    console.error('Error getting token:', error)
    return null
  }
}

export function setToken(key: string, value: string) {
  if (typeof window === 'undefined') return

  localStorage.setItem(key, JSON.stringify(value))
}

export const removeToken = (key: string) => {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing token:', error)
  }
}
