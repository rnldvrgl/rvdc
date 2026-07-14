"use client"
import { ChangelogBanner } from "@/components/custom/changelog/ChangelogBanner"
import { Navbar } from "@/components/custom/navigation/Navbar"
import { Sidebar } from "@/components/custom/navigation/Sidebar"
import { Background } from "@/components/custom/shared/Background"
import { MaintenanceState } from "@/components/layout/maintenance-state"
import { PushNotificationBanner } from "@/components/layout/push-notification-banner"
import { PendingActions } from "@/components/custom/shared/PendingActions"
import { ScrollToTop } from "@/components/custom/shared/ScrollToTop"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useDashboardWebSocket } from "@/lib/hooks/useDashboardWebSocket"
import { usePushNotifications } from "@/lib/hooks/usePushNotifications"
import { useSidebarCollapse } from "@/lib/hooks/useSidebarCollapse"
import { useSystemSettings } from "@/lib/queries/useSystemSettings"
import { useUserProfile } from "@/lib/queries/useUserProfile"
import useUserProfileStore from "@/lib/store/useUserProfileStore"
import { cn } from "@/lib/utils/helpers"
import { AnimatePresence, motion } from "framer-motion"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import React, { useEffect } from "react"

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { collapsed } = useSidebarCollapse()
    const { userProfile, isAdmin } = useCurrentUser()
    const { data: systemSettings } = useSystemSettings()
    const { data: freshProfile } = useUserProfile()
    const setUserProfile = useUserProfileStore((s) => s.setUserProfile)
    useEffect(() => {
        if (freshProfile) setUserProfile(freshProfile)
    }, [freshProfile, setUserProfile])
    const inMaintenance = systemSettings?.maintenance_mode === true && !isAdmin
    useDashboardWebSocket()
    const {
        enablePushNotifications,
        permission: pushPermission,
        subscribed: pushSubscribed,
        ready: pushReady,
    } = usePushNotifications()
    const showPushBanner = pushReady && pushPermission === "default" && !pushSubscribed

    return (
        <div className="min-h-screen isolate relative">
            <Analytics />
            <SpeedInsights />
            <Background />
            <AnimatePresence mode="wait">
                {inMaintenance ? (
                    <motion.div
                        key="maintenance"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                        <MaintenanceState />
                    </motion.div>
                ) : (
                    <motion.div
                        key="app"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                        {/* Sidebar — fixed on desktop, top bar on mobile */}
                        <div className="fixed top-0 left-0 lg:h-full z-40 w-full lg:w-auto">
                            <Sidebar />
                        </div>
                        {/* Main content — offset matches sidebar widths exactly */}
                        <div
                            className={cn(
                                "flex flex-col min-h-screen transition-[margin] relative duration-300 ease-in-out",
                                "mt-[calc(3.5rem+env(safe-area-inset-top))] lg:mt-0",
                                collapsed ? "lg:ml-[76px]" : "lg:ml-[264px]",
                            )}
                        >
                            <AnimatePresence initial={false}>
                                {showPushBanner && (
                                    <motion.div
                                        key="push-banner"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        style={{ overflow: "hidden" }}
                                    >
                                        <PushNotificationBanner
                                            action={() => void enablePushNotifications()}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <Navbar user={userProfile} />
                            <ChangelogBanner />
                            <main className="flex-1 flex flex-col">
                                {children}
                            </main>
                        </div>
                        <ScrollToTop />
                        <PendingActions />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
