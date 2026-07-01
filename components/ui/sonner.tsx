"use client"

import {
    CircleCheckIcon,
    InfoIcon,
    Loader2Icon,
    OctagonXIcon,
    TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const toastIconClassName = "size-4 shrink-0"

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            icons={{
                success: (
                    <CircleCheckIcon className={`${toastIconClassName} text-success`} />
                ),
                info: <InfoIcon className={`${toastIconClassName} text-info`} />,
                warning: (
                    <TriangleAlertIcon className={`${toastIconClassName} text-warning`} />
                ),
                error: (
                    <OctagonXIcon className={`${toastIconClassName} text-destructive`} />
                ),
                loading: <Loader2Icon className="size-4 animate-spin" />,
            }}
            toastOptions={{
                className:
                    "group toast group-[.toaster]:rounded-[1.125rem] group-[.toaster]:border group-[.toaster]:border-border/45 group-[.toaster]:bg-card/90 group-[.toaster]:text-card-foreground group-[.toaster]:shadow-md group-[.toaster]:shadow-[color:var(--shadow-color)]/6 group-[.toaster]:backdrop-blur-xl group-[.toaster]:px-3.5 group-[.toaster]:py-3 group-[.toaster]:ring-1 group-[.toaster]:ring-inset group-[.toaster]:ring-white/20 dark:group-[.toaster]:ring-white/5",
            }}
            style={{
                "--normal-bg": "color-mix(in oklch, var(--card) 88%, var(--background))",
                "--normal-text": "var(--foreground)",
                "--normal-border": "color-mix(in oklch, var(--border) 72%, transparent)",
                "--border-radius": "var(--radius)",
                "--success-bg": "color-mix(in oklch, var(--success-muted) 78%, var(--background))",
                "--success-text": "var(--success-muted-foreground)",
                "--success-border": "color-mix(in oklch, var(--success-muted) 70%, transparent)",
                "--info-bg": "color-mix(in oklch, var(--info-muted) 78%, var(--background))",
                "--info-text": "var(--info-muted-foreground)",
                "--info-border": "color-mix(in oklch, var(--info-muted) 70%, transparent)",
                "--warning-bg": "color-mix(in oklch, var(--warning-muted) 78%, var(--background))",
                "--warning-text": "var(--warning-muted-foreground)",
                "--warning-border": "color-mix(in oklch, var(--warning-muted) 70%, transparent)",
                "--error-bg": "color-mix(in oklch, var(--destructive) 16%, var(--background))",
                "--error-text": "var(--destructive-foreground)",
                "--error-border": "color-mix(in oklch, var(--destructive) 55%, transparent)",
            } as React.CSSProperties}
            {...props}
        />
    )
}

export { Toaster }
