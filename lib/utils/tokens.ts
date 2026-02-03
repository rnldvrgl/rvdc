export const getToken = (key: string) => {
  if (typeof window === "undefined") return null

  try {
    const tokenStr = localStorage.getItem(key)
    if (!tokenStr) return null

    const token = JSON.parse(tokenStr)
    if (token) {
      return token
    }

    return null
  } catch {
    return null
  }
}

export function setToken(key: string, value: string) {
  if (typeof window === "undefined") return

  localStorage.setItem(key, JSON.stringify(value))
}

export const removeToken = (key: string) => {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(key)
  } catch {
    // error is handled by mutation
  }
}

export const removeAllTokens = () => {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem("access")
    localStorage.removeItem("refresh")
    localStorage.removeItem("remember")
  } catch {
    // error is handled by mutation
  }
}
