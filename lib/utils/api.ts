import { getToken, removeToken } from '@/lib/utils/tokens'
import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

const isServer = typeof window === 'undefined'

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || '' // fallback if undefined

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor
interface ServerCookieStore {
  get: (name: string) => { value: string } | undefined
}

api.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> => {
    let token: string | undefined

    if (isServer) {
      // On server: use Next.js headers
      const { cookies }: { cookies: () => Promise<ServerCookieStore> } =
        await import('next/headers')
      const cookieStore: ServerCookieStore = await cookies()
      token = cookieStore.get('token')?.value
    } else {
      // On client: use cookie or fallback to getToken()
      const cookieToken: string = document.cookie.replace(
        /(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/,
        '$1',
      )
      const localToken = getToken() ?? undefined
      token =
        typeof cookieToken === 'string' && cookieToken
          ? cookieToken
          : typeof localToken === 'string'
          ? localToken
          : undefined
    }

    if (token) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  },
  (error: unknown) => Promise.reject(error),
)

// Add response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as AxiosRequestConfig & {
      _retry?: boolean
    }

    if (
      originalConfig?.url !== '/token/' &&
      error.response?.status &&
      [401, 403].includes(error.response.status) &&
      !originalConfig._retry
    ) {
      originalConfig._retry = true
      removeToken()

      if (!isServer) {
        window.location.href = '/login'
      }

      return Promise.reject(error)
    }

    return Promise.reject(error)
  },
)

export default api
