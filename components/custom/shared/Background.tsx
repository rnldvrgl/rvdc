"use client"
import { useMounted } from "@/lib/hooks/useMounted"

export function Background() {
    const mounted = useMounted()
    if (!mounted) return null
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
            <div className="absolute inset-0 app-background-surface" />
            <div className="absolute inset-0 app-background-grid" />
        </div>
    )
}
