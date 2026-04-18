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

  const draftQuickActions = (
    <>
      <Button
        size="sm"
        variant="success"
        onClick={onApprove}
        disabled={isProcessing}
        className="h-9 px-4"
      >
        <CheckCircle className="h-4 w-4 mr-1.5" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onAddEarning}
        disabled={isProcessing}
        className="h-9 px-4"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add Earning
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onAddDeduction}
        disabled={isProcessing}
        className="h-9 px-4"
      >
        <PhilippinePesoIcon className="h-4 w-4 mr-1.5" />
        Add Deduction
      </Button>
      {onAddCashAdvance && (
        <Button
          size="sm"
          variant="outline"
          onClick={onAddCashAdvance}
          disabled={isProcessing}
          className="h-9 px-4"
        >
          <CreditCard className="h-4 w-4 mr-1.5" />
          Cash Advance
        </Button>
      )}
      <Button
        size="sm"
        variant="secondary"
        onClick={onRecompute}
        disabled={isProcessing}
        className="h-9 px-4"
      >
        <RefreshCw className="h-4 w-4 mr-1.5" />
        Recompute
      </Button>
    </>
  )

  const draftOverflowActions = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={isProcessing}
          className="h-9 px-4"
        >
          Actions
          <ChevronDown className="h-4 w-4 ml-1.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
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
  )

  return (
    <div className="rounded-xl border bg-card/80 px-3 py-3 shadow-sm backdrop-blur-sm print:hidden">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Payroll Actions
          </span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
          <span className="text-xs text-muted-foreground">
            {status === "draft" ? "Draft" : "Approved"} workflow
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {status === "draft" && (
            <>
              <div className="hidden xl:flex flex-wrap items-center gap-2">
                {draftQuickActions}
              </div>
              <div className="xl:hidden">{draftOverflowActions}</div>
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
                  className="h-9 px-4"
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
                className="h-9 px-4"
              >
                <Banknote className="h-4 w-4 mr-1.5" />
                Mark as Paid
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
