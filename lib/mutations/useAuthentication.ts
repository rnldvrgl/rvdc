"use client"

import { LoginFormValues } from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import useUserProfileStore from "@/lib/store/useUserProfileStore"
import api from "@/lib/utils/api"
import { removeToken, setToken } from "@/lib/utils/tokens"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function useAuthentications() {
  const useLogin = () => {
    const router = useRouter()
    const setUserProfile = useUserProfileStore((state) => state.setUserProfile)

    return useApiMutation({
      mutationFn: async (values: LoginFormValues) => {
        const response = await api.post("/auth/login/", values)
        return response.data
      },
      onSuccess: async (data) => {
        const { access, refresh, role } = data

        // Set tokens in localStorage
        setToken("access", access)
        setToken("refresh", refresh)
        setToken("remember", "true")

        // Set HTTP-only cookies
        try {
          const cookieRes = await fetch("/api/set-cookie", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ access, refresh, role }),
            credentials: "include",
          })

          if (!cookieRes.ok) {
            throw new Error("Failed to set auth cookies")
          }
        } catch {
          // error is handled by mutation
        }

        // Set user profile in store
        setUserProfile(data)

        toast.success(`Welcome back, ${data.first_name}!`)

        // Wait a bit for state to update
        await new Promise((res) => setTimeout(res, 200))

        // Redirect to dashboard
        router.push("/dashboard")
      },
    })
  }

  const useLogout = () => {
    const router = useRouter()
    const clearUserProfile = useUserProfileStore(
      (state) => state.clearUserProfile,
    )

    return useApiMutation({
      mutationFn: async (refresh: string) =>
        api.post("/auth/logout/", { refresh }),
      usePromiseToast: true,
      onSuccess: async () => {
        // Remove tokens from storage
        removeToken("access")
        removeToken("refresh")
        removeToken("remember")

        // Tell the server to delete HTTP-only cookies
        try {
          const res = await fetch("/api/delete-cookie", {
            method: "POST",
            credentials: "include",
          })

          if (!res.ok) {
            toast.error("Failed to delete auth cookies")
          }
        } catch {
          // error is handled by mutation
        }

        // Clear client-side user state
        clearUserProfile()

        toast.warning("You have been logged out.")

        // Redirect to home
        router.push("/")
      },
    })
  }

  return {
    useLogin,
    useLogout,
  }
}
