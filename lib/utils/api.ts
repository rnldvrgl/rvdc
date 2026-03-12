import { deleteCookie } from "@/lib/utils/cookies"
import { getToken, removeToken, setToken } from "@/lib/utils/tokens"
import axios from "axios"
import qs from "qs"
import { toast } from "sonner"

const baseURL = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"}/api`
const api = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds — prevents indefinitely hanging requests
  headers: {
    "Content-Type": "application/json",
  },
  paramsSerializer: (params) => {
    return qs.stringify(params, { arrayFormat: "repeat", skipNulls: true })
  },
})

// Mutex for token refresh — prevents concurrent refresh attempts
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

// Request Interceptor — Attach token
api.interceptors.request.use(
  async (config) => {
    const access_token = await getToken("access")
    if (access_token) {
      config.headers["Authorization"] = `Bearer ${access_token}`
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
        const refresh = getToken("refresh")
        if (!refresh) {
          // No refresh token — force logout
          removeToken("access")
          removeToken("refresh")
          removeToken("remember")
          deleteCookie()
          window.location.href = "/"
          return new Promise(() => {})
        }

        // If already refreshing, queue this request
        if (isRefreshing) {
          return new Promise((resolve) => {
            addRefreshSubscriber((newToken: string) => {
              originalRequest.headers["Authorization"] = `Bearer ${newToken}`
              resolve(api(originalRequest))
            })
          })
        }

        isRefreshing = true

        try {
          const res = await axios.post(`${baseURL}/auth/token/refresh/`, {
            refresh,
          })
          const { access: newAccess, refresh: newRefresh } = res.data

          if (newAccess && newRefresh) {
            setToken("access", newAccess)
            setToken("refresh", newRefresh)

            // Update cookies via API route
            try {
              await fetch("/api/set-cookie", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  access: newAccess,
                  refresh: newRefresh,
                  role: getToken("role") || undefined,
                }),
                credentials: "include",
              })
            } catch {
              // Cookie update is best-effort
            }

            isRefreshing = false
            onRefreshed(newAccess)

            originalRequest.headers["Authorization"] = `Bearer ${newAccess}`
            return api(originalRequest)
          }
        } catch {
          isRefreshing = false
          refreshSubscribers = []
        }
      }

      // Refresh failed or not applicable — clean logout
      removeToken("access")
      removeToken("refresh")
      removeToken("remember")
      deleteCookie()

      window.location.href = "/"
      toast.error("Your session has expired. Please login again.")

      return new Promise(() => {})
    }

    return Promise.reject(error)
  },
)

export default api
