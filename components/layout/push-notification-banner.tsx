"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/helpers"
import { Bell } from "lucide-react"

interface PushNotificationBannerProps {
    action: () => void
    className?: string
}

export function PushNotificationBanner({
    action,
    className,
}: PushNotificationBannerProps) {
    return (
        <div
            className={cn(
                "mx-4 mt-3 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/60 px-4 py-3 text-sm z-99999 backdrop-blur-md",
                className,
            )}
        >
            <Bell className="size-5 shrink-0 text-foreground/90" />
            <div className="min-w-0">
                <p className="font-medium text-foreground">Enable push notifications</p>
                <p className="text-xs text-muted-foreground">
                    Let browser ask for notification permission.
                </p>
            </div>
            <Button
                type="button"
                size="sm"
                onClick={action}
                className="shrink-0"
            >
                Enable
            </Button>
        </div>
    )
}
