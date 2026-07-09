"use client"

import { useDeviceNetworkStatus } from "@/lib/hooks/useDeviceNetworkStatus"
import { playConnectionSound } from "@/lib/sound"
import { AnimatePresence, motion } from "framer-motion"
import { Wifi, WifiOff } from "lucide-react"
import { useEffect, useRef, useState } from "react"

/* -------------------------------------------------------------------------
 * Presentational toast (shared by both states)
 * ---------------------------------------------------------------------- */

interface StatusToastProps {
    tone: "destructive" | "success"
    icon: React.ReactNode
    title: string
    description: string
}

function StatusToast({ tone, icon, title, description }: StatusToastProps) {
    return (
        <motion.div
            initial={{ y: -10, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto max-w-md"
        >
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background/95 backdrop-blur-md shadow-sm py-2.5 px-3.5">
                <div
                    className={`flex items-center justify-center size-7 rounded-full shrink-0 ${tone === "destructive" ? "text-destructive" : "text-success"
                        }`}
                >
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight">{title}</p>
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">{description}</p>
                </div>
            </div>
        </motion.div>
    )
}

/* -------------------------------------------------------------------------
 * Banner
 * ---------------------------------------------------------------------- */

export function NetworkStatusBanner() {
    const isOnline = useDeviceNetworkStatus()
    const [showReconnected, setShowReconnected] = useState(false)
    const wasOfflineRef = useRef(false)
    const isFirstRenderRef = useRef(true)

    useEffect(() => {
        // Skip the sound + reconnected toast on mount — only react to real transitions.
        if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false
            wasOfflineRef.current = !isOnline
            return
        }

        if (!isOnline) {
            wasOfflineRef.current = true
            setShowReconnected(false)
            playConnectionSound("offline")
            return
        }

        if (wasOfflineRef.current) {
            wasOfflineRef.current = false
            setShowReconnected(true)
            playConnectionSound("online")
            const timeout = setTimeout(() => setShowReconnected(false), 2800)
            return () => clearTimeout(timeout)
        }
    }, [isOnline])

    return (
        <div className="fixed top-16 lg:top-20 inset-x-0 lg:inset-x-auto lg:right-6 z-[9999] flex justify-center lg:justify-end pointer-events-none px-4 lg:px-0">
            <AnimatePresence mode="wait">
                {!isOnline && (
                    <StatusToast
                        key="offline"
                        tone="destructive"
                        icon={<WifiOff className="size-4" />}
                        title="No connection"
                        description="Write it down for now — nothing will save until you're back online."
                    />
                )}

                {showReconnected && isOnline && (
                    <StatusToast
                        key="online"
                        tone="success"
                        icon={<Wifi className="size-4" />}
                        title="Back online"
                        description="You're reconnected — go ahead and save anything you were holding onto."
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
