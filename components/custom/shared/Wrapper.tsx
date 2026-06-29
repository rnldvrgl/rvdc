"use client"
import { cn } from "@/lib/utils/helpers"

type WrapperProps = {
    children: React.ReactNode
    maxWidth?: "default" | "wide" | "full" | "narrow" | (string & {})
    className?: string
}

const maxWidthMap = {
    default: "max-w-full",
    wide: "max-w-full",
    full: "max-w-full",
    narrow: "max-w-3xl",
}

export function Wrapper({
    children,
    maxWidth = "default",
    className,
}: WrapperProps) {
    const resolvedMaxWidth =
        maxWidthMap[maxWidth as keyof typeof maxWidthMap] ?? maxWidth

    return (
        <div
            className={cn(
                "px-3 md:px-4 py-4 space-y-8 transition-all duration-300",
                resolvedMaxWidth,
                className,
            )}
        >
            {children}
        </div>
    )
}
