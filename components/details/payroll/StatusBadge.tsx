import { Badge } from "@/components/ui/badge"
import { PayrollStatus } from "@/lib/constants/types"
import { cn } from "@/lib/utils/helpers"
import { Banknote, CheckCircle, FileText, LucideIcon } from "lucide-react"

const STATUS_CONFIG: Record<
  PayrollStatus,
  { color: string; icon: LucideIcon; label: string }
> = {
  draft: {
    color:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600",
    icon: FileText,
    label: "Draft",
  },
  approved: {
    color:
      "bg-green-100 text-success dark:bg-green-900 border-green-300 dark:border-green-600",
    icon: CheckCircle,
    label: "Approved",
  },
  paid: {
    color:
      "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-600",
    icon: Banknote,
    label: "Paid",
  },
}

interface StatusBadgeProps {
  status: PayrollStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <Badge className={cn("gap-1.5 shrink-0", config.color)}>
      <Icon className="h-3 w-3" />
      <span className="text-xs">{config.label}</span>
    </Badge>
  )
}
