// import { refreshToken } from '@/lib/utils/auth'
// import { getToken } from '@/lib/utils/tokens'
// import axios, { AxiosError, AxiosRequestConfig } from 'axios'

// const isServer = typeof window === 'undefined'
// const baseURL = process.env.NEXT_PUBLIC_BASE_URL || ''

// const api = axios.create({
//   baseURL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// })

// let isRefreshing = false
// let refreshSubscribers: ((token: string) => void)[] = []

// // Request Interceptor — Attach token
// api.interceptors.request.use(async (config) => {
//   try {
//     const access_token = await getToken('access_token')

//     if (access_token) {
//       config.headers['Authorization'] = `Bearer ${access_token}`
//     }
//   } catch (error) {
//     console.error('Error getting access token:', error)
//   }

//   return config
// })

// // Response Interceptor — Handle 401 and refresh token
// api.interceptors.response.use(
//   (response) => response,
//   async (error: AxiosError) => {
//     const originalRequest = error.config as AxiosRequestConfig & {
//       _retry?: boolean
//     }

//     // If not 401, just reject
//     if (error.response?.status !== 401) {
//       return Promise.reject(error)
//     }

//     // If we've already retried this request, fail
//     if (originalRequest._retry) {
//       return Promise.reject(error)
//     }

//     const keepMeLoggedIn =
//       typeof window !== 'undefined' &&
//       localStorage.getItem('remember_me') === 'true'

//     if (!keepMeLoggedIn) {
//       handleLogout()
//       return Promise.reject(error)
//     }

//     if (!isRefreshing) {
//       isRefreshing = true
//       try {
//         const res = await refreshToken()
//         const newAccessToken = res?.data?.access_token
//         if (newAccessToken) {
//           onRefreshed(newAccessToken)
//         }
//       } catch (refreshErr) {
//         console.error('Refresh failed:', refreshErr)
//         handleLogout()
//       } finally {
//         isRefreshing = false
//       }
//     }

//     originalRequest._retry = true

//     return new Promise((resolve, reject) => {
//       subscribeTokenRefresh((token: string) => {
//         if (originalRequest.headers) {
//           originalRequest.headers['Authorization'] = `Bearer ${token}`
//         }
//         resolve(api(originalRequest))
//       })
//     })
//   },
// )

// function subscribeTokenRefresh(cb: (token: string) => void) {
//   refreshSubscribers.push(cb)
// }

// function onRefreshed(token: string) {
//   refreshSubscribers.forEach((cb) => cb(token))
//   refreshSubscribers = []
// }

// function handleLogout() {
//   removeTokens()
//   removeCookie('access_token')
//   removeCookie('refresh_token')
//   localStorage.removeItem('remember_me')
//   window.location.href = '/'
// }

// export default api
