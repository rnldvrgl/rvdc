"use client"
import FloatingChat from "@/components/custom/chat/FloatingChat"
import { Navbar } from "@/components/custom/navigation/Navbar"
import { Sidebar } from "@/components/custom/navigation/Sidebar"
import { Background } from "@/components/custom/shared/Background"
import { ScrollToTop } from "@/components/custom/shared/ScrollToTop"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useDashboardWebSocket } from "@/lib/hooks/useDashboardWebSocket"
import { usePushNotifications } from "@/lib/hooks/usePushNotifications"
import { useSidebarCollapse } from "@/lib/hooks/useSidebarCollapse"
import useChatStore from "@/lib/store/useChatStore"
import { cn } from "@/lib/utils/helpers"
import React, { useEffect } from "react"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { collapsed } = useSidebarCollapse()
  const { userProfile } = useCurrentUser()

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

        <main className="flex-1 flex flex-col">{children}</main>
      </div>

      <ScrollToTop />
      <FloatingChat />
    </div>
  )
}
