import { getOrCreateDeviceId } from "@/lib/utils/device"

// ── Storage mode (persistent vs session-only) ─────────────────────────────────
const SESSION_ONLY_FLAG = "__rvdc_so"

export function isSessionOnly(): boolean {
  if (typeof window === "undefined") return false
  return sessionStorage.getItem(SESSION_ONLY_FLAG) === "1"
}

export function setStorageMode(persist: boolean): void {
  if (typeof window === "undefined") return
  if (persist) {
    sessionStorage.removeItem(SESSION_ONLY_FLAG)
  } else {
    sessionStorage.setItem(SESSION_ONLY_FLAG, "1")
    localStorage.removeItem("access")
    localStorage.removeItem("refresh")
  }
}

function getStorage(): Storage {
  if (typeof window === "undefined") return localStorage
  return isSessionOnly() ? sessionStorage : localStorage
}

export const getToken = (key: string): string | null => {
  if (typeof window === "undefined") return null
  try {
    const val = getStorage().getItem(key)
    if (!val) return null
    return JSON.parse(val) || null
  } catch {
    return null
  }
}

export function setToken(key: string, value: string): void {
  if (typeof window === "undefined") return
  getStorage().setItem(key, JSON.stringify(value))
}

export const removeToken = (key: string): void => {
  if (typeof window === "undefined") return
  try { localStorage.removeItem(key) } catch { /* ignore */ }
  try { sessionStorage.removeItem(key) } catch { /* ignore */ }
}

export const removeAllTokens = (): void => {
  if (typeof window === "undefined") return
  for (const key of ["access", "refresh", "remember"]) {
    try { localStorage.removeItem(key) } catch { /* ignore */ }
    try { sessionStorage.removeItem(key) } catch { /* ignore */ }
  }
}

// ── Cross-tab token synchronisation (BroadcastChannel) ───────────────────────
type TokenMessage = { access: string; refresh: string }
const BROADCAST_CHANNEL = "rvdc_tokens"

function broadcastNewTokens(access: string, refresh: string): void {
  if (typeof window === "undefined") return
  try {
    const ch = new BroadcastChannel(BROADCAST_CHANNEL)
    ch.postMessage({ access, refresh } satisfies TokenMessage)
    ch.close()
  } catch { /* BroadcastChannel unsupported — graceful degradation */ }
}

function awaitTokenBroadcast(ms = 2500): Promise<RefreshResult | null> {
  if (typeof window === "undefined") return Promise.resolve(null)
  return new Promise((resolve) => {
    let ch: BroadcastChannel | null = null
    const timer = setTimeout(() => { ch?.close(); resolve(null) }, ms)
    try {
      ch = new BroadcastChannel(BROADCAST_CHANNEL)
      ch.onmessage = ({ data }: MessageEvent<TokenMessage>) => {
        if (data?.access) {
          clearTimeout(timer)
          ch?.close()
          setToken("access", data.access)
          if (data.refresh) setToken("refresh", data.refresh)
          resolve({ access: data.access, refresh: data.refresh })
        }
      }
    } catch { clearTimeout(timer); resolve(null) }
  })
}

// ── Token refresh ─────────────────────────────────────────────────────────────
type RefreshResult = {
  access: string
  refresh?: string
}

let refreshPromise: Promise<RefreshResult | null> | null = null

async function performTokenRefresh(): Promise<RefreshResult | null> {
  const refresh = getToken("refresh")
  if (!refresh) return null

  const deviceId = getOrCreateDeviceId()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
  const url = `${baseUrl}/api/auth/token/refresh/`
  const body = JSON.stringify({ refresh, device_id: deviceId })

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      })

      if (res.ok) {
        const data = await res.json()
        if (!data?.access) return null

        setToken("access", data.access)
        if (data.refresh) setToken("refresh", data.refresh)

        broadcastNewTokens(data.access, data.refresh ?? refresh)

        return { access: data.access, refresh: data.refresh }
      }

      if (res.status === 401) {
        return awaitTokenBroadcast(2500)
      }
    } catch {
      // Network error — retry
    }

    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }

  return null
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

export async function refreshAccessToken(): Promise<boolean> {
  const refreshed = await refreshTokens()
  return Boolean(refreshed?.access)
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1]))
    const exp = payload.exp
    if (!exp) return true
    return Date.now() / 1000 > exp - 60
  } catch {
    return true
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  const token = getToken("access")
  if (!token) return null

  if (!isTokenExpired(token)) return token

  const ok = await refreshAccessToken()
  if (ok) return getToken("access")

  return null
}
