import { getToken, refreshTokens, removeToken, isSessionOnly } from "@/lib/utils/tokens"
import { getOrCreateDeviceId } from "@/lib/utils/device"
import axios from "axios"
import qs from "qs"
import { toast } from "sonner"

const baseURL = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"}/api`
const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  paramsSerializer: (params) => {
    return qs.stringify(params, { arrayFormat: "repeat", skipNulls: true })
  },
})

let isRefreshing = false
let refreshSubscribers: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []
let isHandlingSessionExpiry = false

function onRefreshed(token: string) {
  refreshSubscribers.forEach(({ resolve }) => resolve(token))
  refreshSubscribers = []
}

function onRefreshFailed(error: unknown) {
  refreshSubscribers.forEach(({ reject }) => reject(error))
  refreshSubscribers = []
}

function addRefreshSubscriber(
  resolve: (token: string) => void,
  reject: (error: unknown) => void,
) {
  refreshSubscribers.push({ resolve, reject })
}

async function clearAuthState() {
  removeToken("access")
  removeToken("refresh")
  removeToken("remember")

  try {
    await fetch("/api/delete-cookie", {
      method: "POST",
      credentials: "include",
      keepalive: true,
    })
  } catch {
    // Best-effort cleanup
  }
}

async function handleSessionExpired() {
  if (isHandlingSessionExpiry) {
    return new Promise<never>(() => {})
  }

  isHandlingSessionExpiry = true
  await clearAuthState()

  toast.error("Your session has expired. Please login again.", {
    id: "session-expired",
  })
  window.location.replace("/")

  return new Promise<never>(() => {})
}

// Request Interceptor — Attach token
api.interceptors.request.use(
  (config) => {
    const access_token = getToken("access") // sync — no await needed
    const deviceId = getOrCreateDeviceId()
    if (access_token) {
      config.headers["Authorization"] = `Bearer ${access_token}`
    }
    if (deviceId) {
      config.headers["X-Device-ID"] = deviceId
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response Interceptor — Handle 401 + refresh with mutex
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      const errData = error?.response?.data

      const tokenNotValid =
        errData?.code === "token_not_valid" ||
        (typeof errData?.detail === "string" &&
          errData.detail.toLowerCase().includes("token not valid"))

      if (tokenNotValid) {
        const refresh = getToken("refresh") // sync — no await needed
        if (!refresh) {
          return handleSessionExpired()
        }

        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            addRefreshSubscriber(resolve, reject)
          }).then((newToken) => {
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`
            return api(originalRequest)
          })
        }

        isRefreshing = true

        try {
          const refreshed = await refreshTokens()
          const newAccess = refreshed?.access
          const latestRefresh = refreshed?.refresh || getToken("refresh")

          if (newAccess) {
            try {
              await fetch("/api/set-cookie", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  access: newAccess,
                  refresh: latestRefresh || undefined,
                  role: getToken("role") || undefined,
                  rememberMe: !isSessionOnly(), // shared helper, single source of truth
                }),
                credentials: "include",
              })
            } catch {
              // Cookie update is best-effort
            }

            onRefreshed(newAccess)

            originalRequest.headers["Authorization"] = `Bearer ${newAccess}`
            return api(originalRequest)
          }

          onRefreshFailed(new Error("Failed to refresh access token"))
        } catch {
          onRefreshFailed(error)
        } finally {
          isRefreshing = false
        }
      }

      return handleSessionExpired()
    }

    return Promise.reject(error)
  },
)

export default api
