"use client"

import { Detail } from "@/components/details/Detail"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChequeCollection } from "@/lib/constants/interface"
import { formatCurrency } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import {
  Banknote,
  Calendar,
  FileText,
  HandCoins,
  Hash,
  Landmark,
  Receipt,
  User,
} from "lucide-react"

const statusVariants: Record<
  string,
  "default" | "secondary" | "success" | "destructive" | "outline"
> = {
  pending: "secondary",
  deposited: "secondary",
  encashed: "success",
  returned: "destructive",
  bounced: "destructive",
  cancelled: "outline",
}

export function ChequeCollectionDetails({
  entity,
  onClose,
}: {
  entity: ChequeCollection
  onClose: () => void
}) {
  const statusVariant = statusVariants[entity.status] ?? "default"

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center gap-3">
        <Badge
          variant={statusVariant}
          className="px-3 py-1 text-sm"
        >
          {entity.status.toUpperCase()}
        </Badge>
      </div>

      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="size-4" />
            General Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Detail
              label="Client"
              value={entity.client_name}
              icon={<User className="size-4" />}
            />
            <Detail
              label="Issued By"
              value={entity.issued_by}
              icon={<FileText className="size-4" />}
            />
            <Detail
              label="Date Collected"
              value={formatDate(new Date(entity.date_collected))}
              icon={<Calendar className="size-4" />}
            />
            <Detail
              label="Collection Type"
              value={entity.collection_type.trim().replace("_", " ")}
              icon={<HandCoins className="size-4" />}
              className="capitalize"
            />
            {entity.collected_by_name && (
              <Detail
                label="Collected By"
                value={entity.collected_by_name}
                icon={<User className="size-4" />}
              />
            )}
            {entity.notes && (
              <Detail
                label="Notes"
                value={entity.notes}
                icon={<FileText className="size-4" />}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cheque Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Banknote className="size-4" />
            Cheque Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Detail
              label="Cheque #"
              value={entity.cheque_number}
              icon={<Hash className="size-4" />}
            />
            <Detail
              label="Cheque Date"
              value={formatDate(new Date(entity.cheque_date))}
              icon={<Calendar className="size-4" />}
            />
            <Detail
              label="Bank Name"
              value={entity.bank_name}
              icon={<Landmark className="size-4" />}
            />
            {entity.deposit_bank && (
              <Detail
                label="Deposit Bank"
                value={entity.deposit_bank}
                icon={<Landmark className="size-4" />}
              />
            )}
            <Detail
              label="Cheque Amount"
              value={formatCurrency(entity.cheque_amount)}
              icon={<Banknote className="size-4" />}
            />
            <Detail
              label="Billing Amount"
              value={formatCurrency(entity.billing_amount)}
              icon={<Banknote className="size-4" />}
            />
            {entity.or_number && (
              <Detail
                label="OR Number"
                value={entity.or_number}
                icon={<Hash className="size-4" />}
              />
            )}
            {entity.sales_transaction && (
              <Detail
                label="Sales Transaction"
                value={`#${entity.sales_transaction}`}
                icon={<FileText className="size-4" />}
              />
            )}
          </div>
        </CardContent>
      </Card>

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
