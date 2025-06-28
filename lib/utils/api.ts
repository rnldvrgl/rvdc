import { refreshToken } from '@/lib/utils/auth'
import { removeCookie, setCookie } from '@/lib/utils/cookies'
import { getToken, removeToken, setToken } from '@/lib/utils/tokens'
import axios from 'axios'

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || ''
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor — Attach token
api.interceptors.request.use(
  async (config) => {
    const access_token = await getToken('access')
    if (access_token) {
      config.headers['Authorization'] = `Bearer ${access_token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  },
)

// Response Interceptor — Handle 401 + refresh logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response &&
      error.response.status === 401 &&
      error?.response?.data?.code === 'token_not_valid' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      const remember_me = await getToken('remember')

      if (
        error?.response?.data?.code === 'token_not_valid' &&
        remember_me === 'true'
      ) {
        try {
          // Try refresh
          const newAccess = (await refreshToken()) as {
            access: string
            refresh: string
          }
          if (newAccess) {
            setToken('access', newAccess.access)
            setToken('refresh', newAccess.refresh)
            setCookie('access', newAccess.access)
            setCookie('refresh', newAccess.refresh)
            originalRequest.headers[
              'Authorization'
            ] = `Bearer ${newAccess.access}`
            return api(originalRequest)
          }
        } catch (refreshErr) {
          console.error('Token refresh failed:', refreshErr)
        }
      }

      // If not remembered or refresh failed
      removeToken('access')
      removeToken('refresh')
      removeToken('remember')
      removeCookie('access')
      removeCookie('refresh')
      // window.location.href = '/'
    }

    return Promise.reject(error)
  },
)

export default api
