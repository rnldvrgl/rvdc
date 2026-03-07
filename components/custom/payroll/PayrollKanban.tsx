"use client"

import { StatusBadge } from "@/components/details/payroll/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { PayrollStatus, WeeklyPayroll } from "@/lib/constants/types"
import { usePayrollMutations } from "@/lib/mutations/usePayrollMutations"
import { formatCurrency } from "@/lib/utils/currency"
import { format } from "date-fns"
import {
  Banknote,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  User,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface PayrollKanbanProps {
  payrolls: WeeklyPayroll[]
  isLoading: boolean
}

const COLUMNS: { status: PayrollStatus; label: string; color: string; icon: typeof FileText }[] = [
  {
    status: "draft",
    label: "Draft",
    color: "border-t-gray-400",
    icon: FileText,
  },
  {
    status: "approved",
    label: "Approved",
    color: "border-t-blue-500",
    icon: CheckCircle,
  },
  {
    status: "paid",
    label: "Paid",
    color: "border-t-green-500",
    icon: Banknote,
  },
]

export function PayrollKanban({ payrolls, isLoading }: PayrollKanbanProps) {
  const grouped = {
    draft: payrolls.filter((p) => p.status === "draft"),
    approved: payrolls.filter((p) => p.status === "approved"),
    paid: payrolls.filter((p) => p.status === "paid"),
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <ScrollArea className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-3xl pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            color={col.color}
            icon={col.icon}
            payrolls={grouped[col.status]}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

function KanbanColumn({
  label,
  color,
  icon: Icon,
  payrolls,
}: {
  status: PayrollStatus
  label: string
  color: string
  icon: typeof FileText
  payrolls: WeeklyPayroll[]
}) {
  return (
    <div className={`rounded-lg border border-t-4 ${color} bg-muted/30`}>
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 font-medium">
          {payrolls.length}
        </span>
      </div>

      {/* Cards */}
      <div className="p-2 space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto">
        {payrolls.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No {label.toLowerCase()} payrolls
          </div>
        ) : (
          payrolls.map((payroll) => (
            <PayrollCard
              key={payroll.id}
              payroll={payroll}
            />
          ))
        )}
      </div>
    </div>
  )
}

function PayrollCard({ payroll }: { payroll: WeeklyPayroll }) {
  const router = useRouter()
  const { updateStatus } = usePayrollMutations()
  const [isProcessing, setIsProcessing] = useState(false)

  const grossPay = Number(payroll.gross_pay || 0)
  const netPay = Number(payroll.net_pay || 0)
  const totalHours =
    Number(payroll.regular_hours || 0) + Number(payroll.approved_ot_hours || 0)

  const handleStatusChange = async (newStatus: PayrollStatus) => {
    setIsProcessing(true)
    try {
      await updateStatus.mutateAsync({ id: payroll.id, status: newStatus })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow py-0 gap-0"
      onClick={() => router.push(`/payroll/slip/${payroll.id}`)}
    >
      <CardContent className="p-3 space-y-2.5">
        {/* Employee + Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="size-3.5 text-primary" />
            </div>
            <span className="font-semibold text-sm truncate">
              {payroll.employee_name || "Unknown"}
            </span>
          </div>
          <StatusBadge status={payroll.status} />
        </div>

        {/* Week Period */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3" />
          <span>
            {format(new Date(payroll.week_start), "MMM dd")} -{" "}
            {payroll.week_end
              ? format(new Date(payroll.week_end), "MMM dd")
              : ""}
          </span>
        </div>

        {/* Hours */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3" />
          <span>{totalHours.toFixed(1)}h total</span>
        </div>

        {/* Pay Summary */}
        <div className="flex items-center justify-between pt-1 border-t">
          <div>
            <p className="text-[10px] text-muted-foreground">Gross</p>
            <p className="text-xs font-medium">
              ₱{formatCurrency(grossPay)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Net Pay</p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              ₱{formatCurrency(netPay)}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        {payroll.status === "draft" && (
          <Button
            size="sm"
            variant="success"
            className="w-full h-7 text-xs"
            disabled={isProcessing}
            onClick={(e) => {
              e.stopPropagation()
              handleStatusChange("approved")
            }}
          >
            {isProcessing ? (
              <Loader2 className="size-3 animate-spin mr-1" />
            ) : (
              <CheckCircle className="size-3 mr-1" />
            )}
            Approve
          </Button>
        )}
        {payroll.status === "approved" && (
          <Button
            size="sm"
            variant="success"
            className="w-full h-7 text-xs"
            disabled={isProcessing}
            onClick={(e) => {
              e.stopPropagation()
              handleStatusChange("paid")
            }}
          >
            {isProcessing ? (
              <Loader2 className="size-3 animate-spin mr-1" />
            ) : (
              <Banknote className="size-3 mr-1" />
            )}
            Mark as Paid
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
