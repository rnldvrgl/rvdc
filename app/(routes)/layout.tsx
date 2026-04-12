"use client"
import { ChangelogBanner } from "@/components/custom/changelog/ChangelogBanner"
import FloatingChat from "@/components/custom/chat/FloatingChat"
import { Navbar } from "@/components/custom/navigation/Navbar"
import { Sidebar } from "@/components/custom/navigation/Sidebar"
import { Background } from "@/components/custom/shared/Background"
import { PendingActions } from "@/components/custom/shared/PendingActions"
import { ScrollToTop } from "@/components/custom/shared/ScrollToTop"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useDashboardWebSocket } from "@/lib/hooks/useDashboardWebSocket"
import { usePushNotifications } from "@/lib/hooks/usePushNotifications"
import { useSidebarCollapse } from "@/lib/hooks/useSidebarCollapse"
import { useSystemSettings } from "@/lib/queries/useSystemSettings"
import { useUserProfile } from "@/lib/queries/useUserProfile"
import useChatStore from "@/lib/store/useChatStore"
import useUserProfileStore from "@/lib/store/useUserProfileStore"
import { cn } from "@/lib/utils/helpers"
import { SHOP_INFO } from "@/lib/constants/meta"
import { Wrench } from "lucide-react"
import React, { useEffect } from "react"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { collapsed } = useSidebarCollapse()
  const { userProfile, isAdmin } = useCurrentUser()
  const { data: systemSettings } = useSystemSettings()
  const { data: freshProfile } = useUserProfile()
  const setUserProfile = useUserProfileStore((s) => s.setUserProfile)

  // Sync fresh profile from API into store on mount — ensures fields added
  // to the serializer after the user last logged in (e.g. is_superuser) are
  // always up-to-date without requiring a logout/login cycle.
  useEffect(() => {
    if (freshProfile) setUserProfile(freshProfile)
  }, [freshProfile, setUserProfile])

  const inMaintenance = systemSettings?.maintenance_mode === true && !isAdmin

  useDashboardWebSocket()
  usePushNotifications()

  // Listen for service worker messages (push notification chat clicks)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.action === "open_chat" && event.data?.senderId) {
        useChatStore.getState().openChat(event.data.senderId)
      }
    }
    navigator.serviceWorker?.addEventListener("message", handler)
    return () =>
      navigator.serviceWorker?.removeEventListener("message", handler)
  }, [])

  return (
    <div className="min-h-screen">
      <Background />

      {/* Maintenance screen for non-admin users */}
      {inMaintenance && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-sm w-full flex flex-col items-center text-center gap-5">
            <div className="size-18 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center">
              <Wrench className="size-8 text-primary" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Under Maintenance
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We&rsquo;re making improvements to the system. We&rsquo;ll be
                back up shortly. Thank you for your patience.
              </p>
            </div>
            <div className="w-full border-t border-border/40" />
            <p className="text-xs text-muted-foreground/50">{SHOP_INFO.name}</p>
          </div>
        </div>
      )}

      {/* Normal layout — hidden during maintenance */}
      {!inMaintenance && (
        <>
          <div className="fixed top-0 left-0 lg:h-full z-40 w-full lg:w-auto">
            <Sidebar />
          </div>

          {/* Main Content Area */}
          <div
            className={cn(
              "flex flex-col min-h-screen transition-all duration-300 mt-[calc(3.5rem+env(safe-area-inset-top))] lg:mt-0",
              collapsed ? "lg:ml-[108px]" : "lg:ml-72",
            )}
          >
            <Navbar user={userProfile} />
            <ChangelogBanner />
            <main className="flex-1 flex flex-col">{children}</main>
          </div>

          <ScrollToTop />
          <FloatingChat />
          <PendingActions />
        </>
      )}
    </div>
  )
}
