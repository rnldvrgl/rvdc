"use client"
import { useMounted } from "@/lib/hooks/useMounted"

export function Background() {
    const mounted = useMounted()
    if (!mounted) return null
    return (
        <div className="fixed inset-0 z-0 overflow-hidden">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-primary/1" />
            {/* Subtle accent gradient */}
            <div className="absolute opacity-10 inset-0 bg-linear-to-br from-primary/40 via-transparent to-primary/50 dark:from-primary/60 dark:via-transparent dark:to-primary/40" />
        </div>
    )
}
