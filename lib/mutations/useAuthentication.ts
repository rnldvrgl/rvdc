"use client"

import { LoginFormValues } from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import useSettingsStore from "@/lib/store/useSettingsStore"
import useUserProfileStore from "@/lib/store/useUserProfileStore"
import api from "@/lib/utils/api"
import { getOrCreateDeviceId } from "@/lib/utils/device"
import { removeToken, setStorageMode, setToken } from "@/lib/utils/tokens"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function useAuthentications() {
  const useLogin = () => {
    const router = useRouter()
    const setUserProfile = useUserProfileStore((state) => state.setUserProfile)

    return useApiMutation({
      mutationFn: async (values: LoginFormValues) => {
        const deviceId = getOrCreateDeviceId()
        const response = await api.post("/auth/login/", {
          ...values,
          device_id: deviceId,
        })
        return response.data
      },
      onSuccess: async (data, values) => {
        const { access, refresh, role } = data
        const rememberMe = values?.remember_me ?? true

        // Configure storage mode BEFORE writing tokens so they land in the
        // right storage (localStorage for persist, sessionStorage for session-only)
        setStorageMode(rememberMe)

        // Set tokens in chosen storage
        setToken("access", access)
        setToken("refresh", refresh)

        // Set HTTP-only cookies
        try {
          const cookieRes = await fetch("/api/set-cookie", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ access, refresh, role, rememberMe }),
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
        router.push(useSettingsStore.getState().getLandingPage(data.id))
      },
    })
  }

  const useLogout = () => {
    const router = useRouter()
    const queryClient = useQueryClient()
    const clearUserProfile = useUserProfileStore(
      (state) => state.clearUserProfile,
    )

    return useApiMutation({
      mutationFn: async (refresh: string) => {
        // Best-effort: try to blacklist the refresh token on the server
        // If it fails (expired, already blacklisted, network error), still proceed with local cleanup
        try {
          await api.post("/auth/logout/", { refresh })
        } catch {
          // Swallow — we still want to clean up locally
        }
      },
      onSuccess: async () => {
        // Remove tokens from storage
        removeToken("access")
        removeToken("refresh")
        removeToken("remember")

        // Tell the server to delete HTTP-only cookies
        try {
          await fetch("/api/delete-cookie", {
            method: "POST",
            credentials: "include",
          })
        } catch {
          // Best-effort
        }

        // Clear client-side user state
        clearUserProfile()

        // Invalidate all session-related queries so they refetch with latest data
        queryClient.invalidateQueries({ queryKey: ["admin-sessions"] })
        queryClient.invalidateQueries({ queryKey: ["user-sessions"] })
        queryClient.invalidateQueries({ queryKey: ["sessions"] })

        toast.warning("You have been logged out.")

        // Redirect to home
        router.push("/")
      },
      onError: async () => {
        // Even if everything fails, clean up locally
        removeToken("access")
        removeToken("refresh")
        removeToken("remember")
        clearUserProfile()

        try {
          await fetch("/api/delete-cookie", {
            method: "POST",
            credentials: "include",
          })
        } catch {
          // Best-effort
        }

        router.push("/")
      },
    })
  }

  return {
    useLogin,
    useLogout,
  }
}
