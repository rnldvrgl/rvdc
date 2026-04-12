import { Badge } from "@/components/ui/badge"
import { PayrollStatus } from "@/lib/constants/types"
import {
  getStatusConfig,
  payrollStatusConfigMap,
} from "@/lib/utils/statusMapping"
import { Banknote, CheckCircle, FileText, LucideIcon } from "lucide-react"

const STATUS_ICONS: Record<PayrollStatus, LucideIcon> = {
  draft: FileText,
  approved: CheckCircle,
  paid: Banknote,
}

interface StatusBadgeProps {
  status: PayrollStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = getStatusConfig(payrollStatusConfigMap, status, {
    label: status,
    variant: "secondary",
  })
  const Icon = STATUS_ICONS[status] ?? FileText

  return (
    <Badge
      variant={config.variant}
      className="gap-1.5 shrink-0 text-xs font-semibold px-2.5 py-1"
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
