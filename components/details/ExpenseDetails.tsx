"use client"

import { Detail } from "@/components/details/Detail"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Expense } from "@/lib/constants/interface"
import { formatCurrency } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import {
  Building,
  Calendar,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  Receipt,
  RefreshCcw,
  Tag,
  Wallet,
} from "lucide-react"

export function ExpenseDetails({
  entity,
  onClose,
}: {
  entity: Expense
  onClose: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Status badges */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge
          variant={
            entity?.payment_status === "paid"
              ? "default"
              : entity?.payment_status === "partial"
                ? "secondary"
                : "destructive"
          }
        >
          {entity?.payment_status === "paid"
            ? "Paid"
            : entity?.payment_status === "partial"
              ? "Partially Paid"
              : "Unpaid"}
        </Badge>
        {entity?.source && (
          <Badge
            variant="secondary"
            className="capitalize"
          >
            {entity.source}
          </Badge>
        )}
        {entity?.is_reimbursable && (
          <Badge
            variant={
              entity.reimbursement_status === "reimbursed"
                ? "default"
                : entity.reimbursement_status === "partial"
                  ? "secondary"
                  : "destructive"
            }
          >
            {entity.reimbursement_status === "reimbursed"
              ? "Reimbursed"
              : entity.reimbursement_status === "partial"
                ? "Partially Reimbursed"
                : "Pending Reimbursement"}
          </Badge>
        )}
      </div>

      {/* Expense Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="size-4" />
            Expense Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Detail
              label="Description"
              value={entity?.description}
              icon={<ClipboardList className="size-4" />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Detail
                label="Expense Date"
                value={
                  entity?.expense_date
                    ? formatDate(
                        new Date(entity.expense_date),
                        "EEE, MMM dd yyyy",
                      )
                    : "N/A"
                }
                icon={<Calendar className="size-4" />}
              />
              <Detail
                label="Category"
                value={entity?.category_data?.name || "Uncategorized"}
                icon={<Tag className="size-4" />}
              />
              <Detail
                label="Vendor"
                value={entity?.vendor || "N/A"}
                icon={<Building className="size-4" />}
              />
              <Detail
                label="Reference Number"
                value={entity?.reference_number || "N/A"}
                icon={<FileText className="size-4" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="size-4" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Detail
              label="Total Price"
              value={formatCurrency(entity?.total_price ?? 0)}
              icon={<DollarSign className="size-4" />}
            />
            <Detail
              label="Paid Amount"
              value={formatCurrency(entity?.paid_amount ?? 0)}
              icon={<Wallet className="size-4" />}
            />
            <Detail
              label="Balance Due"
              value={formatCurrency(
                (entity?.total_price ?? 0) - (entity?.paid_amount ?? 0),
              )}
              icon={<DollarSign className="size-4" />}
            />
            <Detail
              label="Payment Method"
              value={entity?.payment_method || "N/A"}
              icon={<Wallet className="size-4" />}
            />
            <Detail
              label="Created At"
              value={
                entity?.created_at
                  ? formatDate(
                      new Date(entity.created_at),
                      "EEE, MMM dd yyyy • hh:mm a",
                    )
                  : "N/A"
              }
              icon={<Clock className="size-4" />}
            />
            <Detail
              label="Paid At"
              value={
                entity?.paid_at
                  ? formatDate(
                      new Date(entity.paid_at),
                      "EEE, MMM dd yyyy • hh:mm a",
                    )
                  : "Not yet paid"
              }
              icon={<Clock className="size-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reimbursement Info */}
      {entity?.is_reimbursable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCcw className="size-4" />
              Reimbursement Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Detail
                label="Total Amount"
                value={formatCurrency(entity?.total_price ?? 0)}
                icon={<DollarSign className="size-4" />}
              />
              <Detail
                label="Reimbursed Amount"
                value={formatCurrency(entity?.reimbursed_amount ?? 0)}
                icon={<Wallet className="size-4" />}
              />
              <Detail
                label="Remaining Balance"
                value={formatCurrency(
                  (entity?.total_price ?? 0) - (entity?.reimbursed_amount ?? 0),
                )}
                icon={<DollarSign className="size-4" />}
              />
              <Detail
                label="Reimbursement Method"
                value={entity?.reimbursement_method || "N/A"}
                icon={<Wallet className="size-4" />}
              />
              <Detail
                label="Reimbursed At"
                value={
                  entity?.reimbursed_at
                    ? formatDate(
                        new Date(entity.reimbursed_at),
                        "EEE, MMM dd yyyy • hh:mm a",
                      )
                    : "Not yet reimbursed"
                }
                icon={<Clock className="size-4" />}
              />
              {entity?.reimbursement_notes && (
                <Detail
                  label="Notes"
                  value={entity.reimbursement_notes}
                  icon={<FileText className="size-4" />}
                />
              )}
            </div>
          </CardContent>
        </Card>
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
