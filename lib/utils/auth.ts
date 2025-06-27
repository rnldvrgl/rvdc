// import api from './api'
// import { setCookie } from './cookies'
// import { getToken, setToken } from './tokens'

// export const refreshToken = () => {
//   return new Promise(async (resolve, reject) => {
//     api
//       .post('/auth/token/refresh/', {
//         refresh_token: await getToken('refresh_token'),
//       })
//       .then(async (res) => {
//         if (res?.data?.access_token) {
//           setToken('access_token', res.data.access_token)

//           await setCookie('access_token', res.data.access_token)
//         }
//         if (res?.data?.refresh_token) {
//           setToken('refresh_token', res.data.refresh_token)

//           await setCookie('refresh_token', res.data.refresh_token)
//         }
//         resolve(res.data)
//       })
//       .catch((error) => {
//         console.log(error)
//         reject(error)
//       })
//   })
// }
