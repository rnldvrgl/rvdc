"use client"

import { useEffect, useRef, useState } from "react"

const PING_URL = "/network-check.txt"

// The endpoint is a free static CDN asset (no function invocation, no
// backend involved), so there's no real cost tradeoff in polling fast —
// and for a transactional app, catching a silent "link-up-but-no-internet"
// outage quickly matters more than shaving requests.
const CHECK_INTERVAL_MS = 5_000

// Edge cold starts / brief congestion can take >1s even when the device
// is genuinely online — a too-strict timeout is a false-positive machine.
const CHECK_TIMEOUT_MS = 4_000

// Hysteresis: don't flip to offline on a single dropped ping, but recover
// instantly on the first success (being falsely "offline" is worse than
// briefly missing a blip).
const FAILURES_TO_GO_OFFLINE = 2
const SUCCESSES_TO_GO_ONLINE = 1

async function checkReachability(signal: AbortSignal): Promise<boolean> {
    try {
        await fetch(`${PING_URL}?_=${Date.now()}`, {
            method: "HEAD",
            cache: "no-store",
            signal,
        })
        return true
    } catch {
        return false
    }
}

export function useDeviceNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true)

    const consecutiveFailuresRef = useRef(0)
    const consecutiveSuccessesRef = useRef(0)
    const isCheckingRef = useRef(false)
    const cancelledRef = useRef(false)

    useEffect(() => {
        cancelledRef.current = false
        let pollTimeout: ReturnType<typeof setTimeout>

        const applyResult = (reachable: boolean) => {
            if (cancelledRef.current) return

            if (reachable) {
                consecutiveFailuresRef.current = 0
                consecutiveSuccessesRef.current += 1
                if (consecutiveSuccessesRef.current >= SUCCESSES_TO_GO_ONLINE) {
                    setIsOnline(true)
                }
            } else {
                consecutiveSuccessesRef.current = 0
                consecutiveFailuresRef.current += 1
                if (consecutiveFailuresRef.current >= FAILURES_TO_GO_OFFLINE) {
                    setIsOnline(false)
                }
            }
        }

        // Serialized — only one check ever runs at a time, so a slow/stale
        // response can never land after a newer one and clobber the state.
        const verify = async () => {
            if (isCheckingRef.current) return
            isCheckingRef.current = true

            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)

            const reachable = await checkReachability(controller.signal)

            clearTimeout(timeout)
            isCheckingRef.current = false
            applyResult(reachable)
        }

        // Self-scheduling loop (not setInterval) so the next check is only
        // queued once the current one finishes — no overlap.
        const scheduleNext = () => {
            pollTimeout = setTimeout(async () => {
                if (document.visibilityState === "visible") {
                    await verify()
                }
                scheduleNext()
            }, CHECK_INTERVAL_MS)
        }

        const handleOnline = () => {
            // Don't trust the browser event blindly — confirm real reachability.
            verify()
        }
        const handleOffline = () => {
            // No network stack at all — trust this immediately, no need to wait
            // for hysteresis.
            consecutiveSuccessesRef.current = 0
            consecutiveFailuresRef.current = FAILURES_TO_GO_OFFLINE
            setIsOnline(false)
        }
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") verify()
        }

        verify()
        scheduleNext()

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)
        document.addEventListener("visibilitychange", handleVisibilityChange)

        return () => {
            cancelledRef.current = true
            clearTimeout(pollTimeout)
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
    }, [])

    return isOnline
}
