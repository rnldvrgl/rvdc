type Token = {
  access: string
  refresh: string
}

export const getToken = (): Token | null => {
  let token: Token
  try {
    token = JSON.parse(localStorage.getItem('token') || '')
    if (token) {
      return token
    }
    return null
  } catch (error) {
    console.log('Error getting token')
    return null
  }
}

export const setToken = (token: string): void => {
  try {
    localStorage.setItem('token', JSON.stringify(token))
  } catch (error) {
    console.log('Error setting token ', error)
  }
}

export const removeToken = () => {
  try {
    localStorage.removeItem('user')
  } catch (error) {
    console.log('Error removing token ', error)
  }
}
