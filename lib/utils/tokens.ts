import { getOrCreateDeviceId } from "@/lib/utils/device"

// ── Storage mode (persistent vs session-only) ─────────────────────────────────
// "session only" = tokens in sessionStorage (cleared when the browser tab/window
// is closed). "persistent" (remember me) = tokens in localStorage.
const SESSION_ONLY_FLAG = "__rvdc_so"

function isSessionOnly(): boolean {
  if (typeof window === "undefined") return false
  return sessionStorage.getItem(SESSION_ONLY_FLAG) === "1"
}

/**
 * Call once after login to configure how tokens are stored.
 * persist = true  → localStorage (survives browser restarts)
 * persist = false → sessionStorage (cleared when all tabs are closed)
 */
export function setStorageMode(persist: boolean): void {
  if (typeof window === "undefined") return
  if (persist) {
    sessionStorage.removeItem(SESSION_ONLY_FLAG)
  } else {
    sessionStorage.setItem(SESSION_ONLY_FLAG, "1")
    // Clear any stale long-lived tokens so they do not bleed into this session
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
  // Clear from both storages so no ghost tokens linger
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
// When one tab successfully refreshes tokens it broadcasts the new pair so
// other tabs do not attempt a redundant (and failing) refresh of the now-
// blacklisted old refresh token.

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

/**
 * If the refresh token has been rotated by another tab, wait up to `ms`
 * milliseconds for that tab to broadcast newly issued tokens.
 * Returns the new tokens (and persists them locally) or null on timeout.
 */
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
          // Persist the tokens received from the winning tab
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

  // Retry up to 3 times for transient server errors (e.g. brief Docker restart).
  // A 401 is not retried — it means the token is invalid/blacklisted.
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

        // Notify other open tabs so they skip their own refresh attempt
        broadcastNewTokens(data.access, data.refresh ?? refresh)

        return { access: data.access, refresh: data.refresh }
      }

      if (res.status === 401) {
        // Our refresh token is no longer valid. This can happen when another
        // tab already rotated it (ROTATE_REFRESH_TOKENS = True). Wait briefly
        // for that tab to broadcast the new token pair before giving up.
        return awaitTokenBroadcast(2500)
      }

      // 5xx / unexpected — fall through to retry with backoff
    } catch {
      // Network error (server unreachable) — retry
    }

    if (attempt < 2) {
      // Exponential backoff: 1 s, then 2 s
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
