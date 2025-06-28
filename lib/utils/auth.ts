import api from './api'
import { getToken, setToken } from './tokens'

export const refreshToken = () => {
  return new Promise(async (resolve, reject) => {
    api
      .post('/auth/token/refresh/', {
        refresh: await getToken('refresh'),
      })
      .then((res) => {
        if (res?.data?.access) {
          setToken('access', res.data.access)
        }
        if (res?.data?.refresh) {
          setToken('refresh', res.data.refresh)
        }
        resolve(res.data)
      })
      .catch((error) => {
        console.log(error)
        reject(error)
      })
  })
}
