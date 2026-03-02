import axios from "axios"
import { setCookie } from "./cookies"
import { getToken, setToken } from "./tokens"

const baseURL = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"}/api`

export const refreshToken = async () => {
  const refresh = await getToken("refresh")
  if (!refresh) throw new Error("No refresh token available")

  try {
    const res = await axios.post(`${baseURL}/auth/token/refresh/`, { refresh })
    const { access, refresh: newRefresh } = res.data

    if (access && newRefresh) {
      setToken("access", access)
      setToken("refresh", newRefresh)
      setCookie("access", access)
      setCookie("refresh", newRefresh)
    }

    return { access, refresh: newRefresh }
  } catch (err) {
    console.error("Failed to refresh token:", err)
    throw err
  }
}
