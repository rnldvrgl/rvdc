import { cn } from "@/lib/utils/helpers"
import { FolderCode, LucideIcon } from "lucide-react"

export function EmptyWrapper({
  icon: Icon,
  title = "No data found",
  description = "You're all caught up.",
  action,
  compact = false,
  className,
}: {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: React.ReactNode
  compact?: boolean
  className?: string
}) {
  const IconComponent = Icon ?? FolderCode

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 py-6" : "gap-3 py-10 md:py-14",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-muted/60 text-muted-foreground",
          compact ? "size-10" : "size-14",
        )}
      >
        <IconComponent className={compact ? "size-5" : "size-7"} />
      </div>
      <div className="space-y-1">
        <p
          className={cn(
            "font-medium text-foreground",
            compact ? "text-sm" : "text-base",
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "text-muted-foreground max-w-xs mx-auto",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {description}
        </p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
