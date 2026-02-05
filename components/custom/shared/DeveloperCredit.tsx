import { cn } from "@/lib/utils/helpers"

interface DeveloperCreditProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "subtle" | "print"
}

export function DeveloperCredit({
  className,
  size = "sm",
  variant = "default",
}: DeveloperCreditProps) {
  const sizeClasses = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  }

  const variantClasses = {
    default: "text-muted-foreground",
    subtle: "text-muted-foreground/60",
    print: "text-gray-600 print:text-gray-800",
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 mt-4 print:mt-6",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5",
          sizeClasses[size],
          variantClasses[variant],
        )}
      >
        <span className="font-medium">
          Developed by Ronald Vergel Dela Cruz
        </span>
      </div>
      <div
        className={cn(
          "flex items-center gap-1",
          sizeClasses[size],
          "text-blue-600 dark:text-blue-400 print:text-blue-700",
        )}
      >
        <span className="font-mono">&lt;rnldvrgl /&gt;</span>
      </div>
    </div>
  )
}
