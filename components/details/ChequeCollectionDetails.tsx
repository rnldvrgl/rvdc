"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ChequeCollection } from "@/lib/constants/interface"
import { formatCurrency } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import {
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Hash,
  Landmark,
  Receipt,
  User,
  UserCircle,
} from "lucide-react"

const statusConfig: Record<
  string,
  {
    variant: "default" | "secondary" | "success" | "destructive" | "outline"
    className: string
    label: string
  }
> = {
  pending: {
    variant: "secondary",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    label: "Pending",
  },
  deposited: {
    variant: "default",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    label: "Deposited",
  },
  encashed: {
    variant: "success",
    className: "bg-emerald-100 text-success border-emerald-200",
    label: "Encashed",
  },
  returned: {
    variant: "outline",
    className: "bg-gray-100 text-gray-700 border-gray-300",
    label: "Returned",
  },
  bounced: {
    variant: "destructive",
    className: "bg-rose-100 text-rose-700 border-rose-200",
    label: "Bounced",
  },
  cancelled: {
    variant: "outline",
    className: "bg-gray-100 text-gray-600 border-gray-300",
    label: "Cancelled",
  },
}

function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  className?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          {label}
        </p>
        <p className={`text-sm font-semibold break-words ${className || ""}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

export function ChequeCollectionDetails({
  entity,
  onClose,
}: {
  entity: ChequeCollection
  onClose: () => void
}) {
  const status = statusConfig[entity.status] ?? statusConfig.pending
  const difference =
    Number(entity.cheque_amount) - Number(entity.billing_amount)

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="rounded-xl border bg-gradient-to-br from-background to-muted/20 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Status
            </p>
            <Badge
              className={`px-3 py-1.5 text-sm font-semibold border ${status.className}`}
            >
              {status.label}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Cheque Amount
            </p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(entity.cheque_amount)}
            </p>
          </div>
        </div>
      </div>

      {/* Client & Collection Info */}
      <div className="rounded-xl border bg-background p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center size-9 rounded-lg bg-blue-100 text-blue-600">
            <UserCircle className="size-5" />
          </div>
          <h3 className="text-base font-semibold">Client Information</h3>
        </div>
        <Separator />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoRow
            icon={User}
            label="Client Name"
            value={entity.client_name}
          />
          <InfoRow
            icon={FileText}
            label="Issued By"
            value={entity.issued_by}
          />
          <InfoRow
            icon={CalendarDays}
            label="Date Collected"
            value={formatDate(new Date(entity.date_collected), "MMM dd, yyyy")}
          />
          {entity.collected_by_name && (
            <InfoRow
              icon={User}
              label="Collected By"
              value={entity.collected_by_name}
            />
          )}
        </div>
      </div>

      {/* Cheque Details */}
      <div className="rounded-xl border bg-background p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center size-9 rounded-lg bg-emerald-100 text-success">
            <Receipt className="size-5" />
          </div>
          <h3 className="text-base font-semibold">Cheque Details</h3>
        </div>
        <Separator />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoRow
            icon={Hash}
            label="Cheque Number"
            value={entity.cheque_number}
          />
          <InfoRow
            icon={CalendarDays}
            label="Cheque Date"
            value={formatDate(new Date(entity.cheque_date), "MMM dd, yyyy")}
          />
          <InfoRow
            icon={Building2}
            label="Issuing Bank"
            value={entity.bank_name}
          />
          {entity.deposit_bank && (
            <InfoRow
              icon={Landmark}
              label="Deposit Bank"
              value={entity.deposit_bank}
            />
          )}
          {entity.or_number && (
            <InfoRow
              icon={Hash}
              label="OR Number"
              value={entity.or_number}
            />
          )}
          {entity.sales_transaction && (
            <InfoRow
              icon={Receipt}
              label="Sales Transaction"
              value={`#${entity.sales_transaction}`}
            />
          )}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="rounded-xl border bg-background p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center size-9 rounded-lg bg-violet-100 text-violet-600">
            <Banknote className="size-5" />
          </div>
          <h3 className="text-base font-semibold">Financial Summary</h3>
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm font-medium text-muted-foreground">
              Cheque Amount
            </span>
            <span className="text-lg font-bold">
              {formatCurrency(entity.cheque_amount)}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm font-medium text-muted-foreground">
              Billing Amount
            </span>
            <span className="text-lg font-bold">
              {formatCurrency(entity.billing_amount)}
            </span>
          </div>
          {difference !== 0 && (
            <div
              className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                difference > 0
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-rose-50 border-rose-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`size-5 ${
                    difference > 0 ? "text-success" : "text-destructive"
                  }`}
                />
                <span
                  className={`text-sm font-semibold ${
                    difference > 0 ? "text-success" : "text-rose-700"
                  }`}
                >
                  Difference
                </span>
              </div>
              <span
                className={`text-lg font-bold ${
                  difference > 0 ? "text-success" : "text-rose-700"
                }`}
              >
                {difference > 0 ? "+" : ""}
                {formatCurrency(Math.abs(difference))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {entity.notes && (
        <div className="rounded-xl border bg-background p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-9 rounded-lg bg-amber-100 text-amber-600">
              <FileText className="size-5" />
            </div>
            <h3 className="text-base font-semibold">Notes</h3>
          </div>
          <Separator />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {entity.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end border-t pt-4">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  )
}
