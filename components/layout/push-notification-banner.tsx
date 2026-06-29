"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/helpers"

interface PushNotificationBannerProps {
    onEnable: () => void
    className?: string
}

export function PushNotificationBanner({
    onEnable,
    className,
}: PushNotificationBannerProps) {
    return (
        <div
            className={cn(
                "mx-4 mt-3 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/60 px-4 py-3 text-sm",
                className,
            )}
        >
            <div className="min-w-0">
                <p className="font-medium text-foreground">Enable push notifications</p>
                <p className="text-xs text-muted-foreground">
                    Let browser ask for notification permission.
                </p>
            </div>
            <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onEnable}
                className="shrink-0"
            >
                Enable
            </Button>
        </div>
    )
}
