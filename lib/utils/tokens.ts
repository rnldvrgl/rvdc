import { getOrCreateDeviceId } from "@/lib/utils/device"

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

type RefreshResult = {
  access: string
  refresh?: string
}

let refreshPromise: Promise<RefreshResult | null> | null = null

async function performTokenRefresh(): Promise<RefreshResult | null> {
  try {
    const refresh = getToken("refresh")
    if (!refresh) return null
    const deviceId = getOrCreateDeviceId()

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
    const res = await fetch(`${baseUrl}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh, device_id: deviceId }),
    })

    if (!res.ok) return null

    const data = await res.json()
    if (!data?.access) return null

    setToken("access", data.access)
    if (data.refresh) {
      setToken("refresh", data.refresh)
    }

    return {
      access: data.access,
      refresh: data.refresh,
    }
  } catch {
    return null
  }
}

export async function refreshTokens(): Promise<RefreshResult | null> {
  if (typeof window === "undefined") return null

  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns true if a new access token was obtained.
 */
export async function refreshAccessToken(): Promise<boolean> {
  const refreshed = await refreshTokens()
  return Boolean(refreshed?.access)
}

/**
 * Check if a JWT token is expired or about to expire (within 60s).
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1]))
    const exp = payload.exp
    if (!exp) return true
    // Consider expired if within 60 seconds of expiry
    return Date.now() / 1000 > exp - 60
  } catch {
    return true
  }
}

/**
 * Get a valid (non-expired) access token, refreshing if necessary.
 * Returns null if no valid token can be obtained.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const token = getToken("access")
  if (!token) return null

  if (!isTokenExpired(token)) return token

  // Token is expired or about to expire — try refresh
  const ok = await refreshAccessToken()
  if (ok) return getToken("access")

  return null
}
