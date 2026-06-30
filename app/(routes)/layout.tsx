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
    } = usePushNotifications()

    return (
        <div className="min-h-screen isolate relative">
            <Background />
            {inMaintenance && <MaintenanceState />}

            {!inMaintenance && (
                <>
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
                        {pushPermission === "default" && !pushSubscribed && (
                            <PushNotificationBanner action={() => void enablePushNotifications()} />
                        )}
                        <Navbar user={userProfile} />
                        <ChangelogBanner />
                        <main className="flex-1 flex flex-col">

                            {children}

                        </main>
                    </div>

                    <ScrollToTop />
                    <PendingActions />
                </>
            )}
        </div>
    )
}
