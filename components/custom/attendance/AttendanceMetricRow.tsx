"use client"

import { cn, tint } from "@/lib/utils/helpers"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

type Tone = "default" | "success" | "warning" | "destructive"

const TONE_VAR: Record<Exclude<Tone, "default">, string> = {
    success: "--success",
    warning: "--warning",
    destructive: "--destructive",
}

export function AttendanceMetricRow({
    icon: Icon,
    label,
    value,
    tone = "default",
    wrap = false,
    className,
}: {
    icon: LucideIcon
    label: string
    value: ReactNode
    tone?: Tone
    /** Set true for content like notes that shouldn't be truncated to one line. */
    wrap?: boolean
    className?: string
}) {
    const cssVar = tone === "default" ? null : TONE_VAR[tone]

    return (
        <div
            className={cn("flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border", className)}
            style={{
                backgroundColor: cssVar ? tint(cssVar, 8) : "var(--muted)",
                borderColor: cssVar ? tint(cssVar, 25) : "transparent",
            }}
        >
            <Icon
                className="h-4 w-4 shrink-0 mt-0.5"
                style={{ color: cssVar ? `var(${cssVar})` : "var(--muted-foreground)" }}
            />
            <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: cssVar ? `var(${cssVar})` : "var(--muted-foreground)" }}>
                    {label}
                </p>
                <div className={cn("text-sm font-medium", wrap ? "whitespace-pre-wrap" : "truncate")}>
                    {value}
                </div>
            </div>
        </div>
    )
}
