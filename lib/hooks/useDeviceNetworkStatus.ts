"use client"

import { useEffect, useState } from "react"

const PING_URL = "/api/health"
const CHECK_INTERVAL_MS = 1_000
const CHECK_TIMEOUT_MS = 1_000

async function checkReachability(): Promise<boolean> {
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)

        await fetch(`${PING_URL}?_=${Date.now()}`, {
            method: "HEAD",
            cache: "no-store",
            signal: controller.signal,
        })

        clearTimeout(timeout)
        return true
    } catch {
        return false
    }
}

export function useDeviceNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        let cancelled = false

        const verify = async () => {
            const reachable = await checkReachability()
            if (!cancelled) setIsOnline(reachable)
        }

        const handleOnline = () => {
            // Don't trust "online" blindly — confirm real reachability.
            verify()
        }
        const handleOffline = () => setIsOnline(false)

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") verify()
        }

        setIsOnline(navigator.onLine)
        verify()

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)
        document.addEventListener("visibilitychange", handleVisibilityChange)

        const interval = setInterval(() => {
            if (document.visibilityState === "visible") verify()
        }, CHECK_INTERVAL_MS)

        return () => {
            cancelled = true
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            clearInterval(interval)
        }
    }, [])

    return isOnline
}
