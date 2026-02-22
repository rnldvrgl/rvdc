import { Button } from "@/components/ui/button"
import { PayrollStatus } from "@/lib/constants/types"
import {
  AlertCircle,
  Banknote,
  CheckCircle,
  CreditCard,
  PhilippinePesoIcon,
  Plus,
  RefreshCw,
} from "lucide-react"

interface PayrollActionsProps {
  status: PayrollStatus
  isAdmin: boolean
  isEmployee: boolean
  isProcessing: boolean
  disputed: boolean
  onApprove: () => void
  onMarkPaid: () => void
  onMarkReceived: () => void
  onDispute: () => void
  onRecompute: () => void
  onAddEarning: () => void
  onAddDeduction: () => void
  onAddCashAdvance?: () => void
}

export function PayrollActions({
  status,
  isAdmin,
  isEmployee,
  isProcessing,
  disputed,
  onApprove,
  onMarkPaid,
  onMarkReceived,
  onDispute,
  onRecompute,
  onAddEarning,
  onAddDeduction,
  onAddCashAdvance,
}: PayrollActionsProps) {
  if (isAdmin) {
    return (
      <div className="grid md:grid-cols-5 gap-3 print:hidden">
        {status === "draft" && (
          <>
            <Button
              size="sm"
              variant="success"
              onClick={onAddEarning}
              disabled={isProcessing}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Earning
            </Button>
            <Button
              size="sm"
              variant="warning"
              onClick={onAddDeduction}
              disabled={isProcessing}
            >
              <PhilippinePesoIcon className="h-3.5 w-3.5 mr-1.5" />
              Add Deduction
            </Button>
            {onAddCashAdvance && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onAddCashAdvance}
                disabled={isProcessing}
              >
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                Cash Advance
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onRecompute}
              disabled={isProcessing}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Recompute
            </Button>
            <Button
              size="sm"
              variant="success"
              onClick={onApprove}
              disabled={isProcessing}
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Approve
            </Button>
          </>
        )}
        {status === "approved" && (
          <Button
            size="sm"
            variant="success"
            className="col-span-full"
            onClick={onMarkPaid}
            disabled={isProcessing}
          >
            <Banknote className="h-3.5 w-3.5 mr-1.5" />
            Mark as Paid
          </Button>
        )}
      </div>
    )
  }

  if (isEmployee && status === "paid" && !disputed) {
    return (
      <div className="grid md:grid-cols-2 gap-2 print:hidden">
        <Button
          size="sm"
          variant="success"
          onClick={onMarkReceived}
          disabled={isProcessing}
        >
          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
          Mark Received
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onDispute}
          disabled={isProcessing}
        >
          <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
          Dispute
        </Button>
      </div>
    )
  }

  return null
}
