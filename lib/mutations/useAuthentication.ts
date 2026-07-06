"use client"

import { LoginFormValues } from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import useSettingsStore from "@/lib/store/useSettingsStore"
import useUserProfileStore from "@/lib/store/useUserProfileStore"
import api from "@/lib/utils/api"
import { getOrCreateDeviceId } from "@/lib/utils/device"
import { removeToken, setStorageMode, setToken } from "@/lib/utils/tokens"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export function useAuthentications() {
  const useLogin = () => {
    const queryClient = useQueryClient()
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

        queryClient.clear()
        useUserProfileStore.getState().clearUserProfile()

        setStorageMode(rememberMe)
        setToken("access", access)
        setToken("refresh", refresh)

        const cookieRes = await fetch("/api/set-cookie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access, refresh, role, rememberMe }),
          credentials: "include",
        })

        if (!cookieRes.ok) {
          throw new Error("Failed to set auth cookies")
        }

        setUserProfile(data)
        toast.success(`Welcome back, ${data.first_name}!`)

        window.location.href = useSettingsStore.getState().getLandingPage(data.id)
      },
    })
  }

  const useLogout = () => {
    const queryClient = useQueryClient()
    const clearUserProfile = useUserProfileStore((state) => state.clearUserProfile)

    return useApiMutation({
      mutationFn: async (refresh: string) => {
        try {
          await api.post("/auth/logout/", { refresh })
        } catch {
          // Swallow — proceed with local cleanup regardless
        }
      },
      onSuccess: async () => {
        await cleanupAndRedirect()
      },
      onError: async () => {
        await cleanupAndRedirect()
      },
    })

    async function cleanupAndRedirect() {
      removeToken("access")
      removeToken("refresh")
      removeToken("remember")

      try {
        await fetch("/api/delete-cookie", {
          method: "POST",
          credentials: "include",
        })
      } catch {
        // Best-effort
      }

      clearUserProfile()
      queryClient.clear()

      toast.warning("You have been logged out.")
      window.location.href = "/"
    }
  }

  return { useLogin, useLogout }
}
