import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PayrollStatus } from "@/lib/constants/types"
import {
  Banknote,
  CheckCircle,
  ChevronDown,
  CreditCard,
  PhilippinePesoIcon,
  Plus,
  RefreshCw,
  Undo2,
} from "lucide-react"

interface PayrollActionsProps {
  status: PayrollStatus
  isAdmin: boolean
  isProcessing: boolean
  onApprove: () => void
  onMarkPaid: () => void
  onRecompute: () => void
  onAddEarning: () => void
  onAddDeduction: () => void
  onAddCashAdvance?: () => void
  onReturnToDraft?: () => void
}

export function PayrollActions({
  status,
  isAdmin,
  isProcessing,
  onApprove,
  onMarkPaid,
  onRecompute,
  onAddEarning,
  onAddDeduction,
  onAddCashAdvance,
  onReturnToDraft,
}: PayrollActionsProps) {
  if (!isAdmin) return null

  return (
    <div className="flex items-center gap-2 print:hidden">
      {status === "draft" && (
        <>
          <Button
            size="sm"
            variant="success"
            onClick={onApprove}
            disabled={isProcessing}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Approve
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={isProcessing}>
                Actions
                <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onAddEarning}>
                <Plus className="h-4 w-4 mr-2" />
                Add Earning
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddDeduction}>
                <PhilippinePesoIcon className="h-4 w-4 mr-2" />
                Add Deduction
              </DropdownMenuItem>
              {onAddCashAdvance && (
                <DropdownMenuItem onClick={onAddCashAdvance}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Cash Advance
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRecompute}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recompute
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
      {status === "approved" && (
        <>
          {onReturnToDraft && (
            <Button
              size="sm"
              variant="outline"
              onClick={onReturnToDraft}
              disabled={isProcessing}
            >
              <Undo2 className="h-3.5 w-3.5 mr-1.5" />
              Return to Draft
            </Button>
          )}
          <Button
            size="sm"
            variant="success"
            onClick={onMarkPaid}
            disabled={isProcessing}
          >
            <Banknote className="h-3.5 w-3.5 mr-1.5" />
            Mark as Paid
          </Button>
        </>
      )}
    </div>
  )
}
