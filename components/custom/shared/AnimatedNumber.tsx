"use client"

import NumberFlow, { NumberFlowGroup, useCanAnimate } from "@number-flow/react"
import { cn } from "@/lib/utils/helpers"
import type { ReactNode } from "react"

type AnimatedNumberProps = {
    value: number
    className?: string
    locales?: Intl.LocalesArgument
    format?: Intl.NumberFormatOptions
    prefix?: string
    suffix?: string
    animated?: boolean
    respectMotionPreference?: boolean
    willChange?: boolean
}

type AnimatedNumberGroupProps = {
    children: ReactNode
}

export function AnimatedNumber({
    value,
    className,
    locales = "en-PH",
    format,
    prefix,
    suffix,
    animated,
    respectMotionPreference,
    willChange,
}: AnimatedNumberProps) {
    const canAnimate = useCanAnimate({
        respectMotionPreference: respectMotionPreference ?? true,
    })

    return (
        <NumberFlow
            value={value}
            locales={locales}
            format={format}
            prefix={prefix}
            suffix={suffix}
            animated={animated ?? canAnimate}
            respectMotionPreference={respectMotionPreference}
            willChange={willChange}
            className={cn(
                "font-mono tabular-nums leading-none [font-variant-numeric:tabular-nums]",
                className,
            )}
        />
    )
}

export function AnimatedNumberGroup({ children }: AnimatedNumberGroupProps) {
    return <NumberFlowGroup>{children}</NumberFlowGroup>
}