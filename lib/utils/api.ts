import { refreshToken } from '@/lib/utils/auth'
import { deleteCookie, setCookie } from '@/lib/utils/cookies'
import { getToken, removeToken, setToken } from '@/lib/utils/tokens'
import axios from 'axios'
import toast from 'react-hot-toast'

const baseURL = process.env.NEXT_PUBLIC_API_URL || ''
const api = axios.create({
  withCredentials: true,
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

// Response Interceptor — Handle 401 + refresh
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
      const remember_me = await getToken('remember')

      // Check typical DRF simplejwt responses
      const tokenNotValid =
        errData?.code === 'token_not_valid' ||
        (typeof errData?.detail === 'string' &&
          errData.detail.toLowerCase().includes('token not valid'))

      if (tokenNotValid && remember_me === 'true') {
        try {
          const newAccess = (await refreshToken()) as {
            access: string
            refresh: string
          }
          if (newAccess?.access) {
            setToken('access', newAccess.access)
            setToken('refresh', newAccess.refresh)
            const { access, refresh } = newAccess
            setCookie({ access, refresh })
            originalRequest.headers[
              'Authorization'
            ] = `Bearer ${newAccess.access}`
            return api(originalRequest)
          }
        } catch (refreshErr) {
          console.error('Token refresh failed:', refreshErr)
        }
      }

      removeToken('access')
      removeToken('refresh')
      removeToken('remember')
      deleteCookie()

      window.location.href = '/'
      toast.error('Your session has expired. Please login again.')

      return new Promise(() => {})
    }

    return Promise.reject(error)
  },
)

export default api
