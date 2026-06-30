"use client"
import { cn } from "@/lib/utils/helpers"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

export interface EmptyStateAction {
    label: string
    onClick: () => void
}

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description?: string
    action?: EmptyStateAction
    className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className={cn(
                "flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-16 text-center",
                className,
            )}
        >
            <div className="relative mb-5">
                <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl" />
                <div className="relative flex size-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                    <Icon className="size-6 text-primary" strokeWidth={1.75} />
                </div>
            </div>
            <h3 className="text-base font-semibold text-foreground">
                {title}
            </h3>
            {description && (
                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {description}
                </p>
            )}
            {action && (
                <Button
                    size="sm"
                    className="mt-6 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                    onClick={action.onClick}
                >
                    {action.label}
                </Button>
            )}
        </motion.div>
    )
}
