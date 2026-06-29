import { cn } from "@/lib/utils/helpers"
import { LucideIcon, Snowflake } from "lucide-react"

interface BrandLockupProps {
  title: string
  description: string
  icon?: LucideIcon
  compact?: boolean
  className?: string
}

export function BrandLockup({
  title,
  description,
  icon: Icon = Snowflake,
  compact = false,
  className,
}: BrandLockupProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        compact ? "gap-3" : "gap-4",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border border-border/60 bg-primary/10 text-primary shadow-sm",
          compact ? "size-14" : "size-20",
        )}
      >
        <Icon className={compact ? "size-5" : "size-7"} />
      </div>
      <div className="space-y-2">
        <h1
          className={cn(
            "font-bold tracking-tight text-foreground",
            compact ? "text-2xl" : "text-3xl",
          )}
        >
          {title}
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}