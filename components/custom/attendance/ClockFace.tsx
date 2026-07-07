"use client"

import { AnimatedNumber, AnimatedNumberGroup } from "@/components/custom/shared/AnimatedNumber"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils/helpers"

export function ClockFace({
    time,
    size = "lg",
    className,
}: {
    time: Date | null
    size?: "sm" | "lg"
    className?: string
}) {
    const digitClass = size === "lg" ? "text-4xl sm:text-5xl font-bold tracking-tight" : "text-2xl sm:text-3xl font-bold tracking-tight"
    const periodClass = size === "lg" ? "text-lg sm:text-xl" : "text-sm sm:text-base"
    const dateClass = size === "lg" ? "text-sm sm:text-base text-muted-foreground" : "text-xs sm:text-sm text-muted-foreground"

    // Sizes tuned to roughly match the rendered digit/date dimensions per variant.
    const digitSkeletonClass = size === "lg" ? "h-9 sm:h-10 w-[168px] sm:w-[192px]" : "h-6 sm:h-7 w-[112px] sm:w-[128px]"
    const dateSkeletonClass = size === "lg" ? "h-5 w-40" : "h-4 w-32"

    if (!time) {
        return (
            <div className={cn("text-center flex flex-col items-center gap-2", className)}>
                <Skeleton className={digitSkeletonClass} />
                <Skeleton className={dateSkeletonClass} />
            </div>
        )
    }

    const hours24 = time.getHours()
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
    const period = hours24 >= 12 ? "PM" : "AM"

    return (
        <div className={cn("text-center flex flex-col items-center gap-2", className)}>
            <div className="flex items-baseline justify-center gap-1">
                <AnimatedNumberGroup>
                    <AnimatedNumber value={hours12} format={{ minimumIntegerDigits: 2 }} className={digitClass} />
                    <span className={digitClass}>:</span>
                    <AnimatedNumber value={time.getMinutes()} format={{ minimumIntegerDigits: 2 }} className={digitClass} />
                    <span className={digitClass}>:</span>
                    <AnimatedNumber value={time.getSeconds()} format={{ minimumIntegerDigits: 2 }} className={digitClass} />
                </AnimatedNumberGroup>
                <span className={cn("font-semibold font-mono text-muted-foreground ml-1.5 self-start mt-1", periodClass)}>
                    {period}
                </span>
            </div>
            <p className={dateClass} suppressHydrationWarning>
                {time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
        </div>
    )
}
