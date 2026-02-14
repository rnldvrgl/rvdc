"use client"

import DatePicker from "@/components/custom/inputs/DatePicker"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRecomputeWeeklyPayroll } from "@/lib/mutations/payroll/usePayrollMutations"
import { useCashAdvanceMutations } from "@/lib/mutations/useCashAdvanceMutations"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, parseISO } from "date-fns"
import { CreditCard, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const cashAdvanceDeductionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  date: z.date({
    required_error: "Please select the date for the cash advance",
  }),
  description: z.string().optional(),
})

type CashAdvanceDeductionFormData = z.infer<typeof cashAdvanceDeductionSchema>

interface AddCashAdvanceDeductionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: number
  employeeName: string
  cashBanBalance?: number
  weekStart?: string
  weekEnd?: string
  payrollId?: number
}

export function AddCashAdvanceDeductionForm({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  cashBanBalance,
  weekStart,
  weekEnd,
  payrollId,
}: AddCashAdvanceDeductionFormProps) {
  const { createMovement } = useCashAdvanceMutations()
  const recomputePayroll = useRecomputeWeeklyPayroll(payrollId ?? 0)

  const minDate = weekStart ? parseISO(weekStart) : undefined
  const maxDate = weekEnd ? parseISO(weekEnd) : new Date()

  const form = useForm<CashAdvanceDeductionFormData>({
    resolver: zodResolver(cashAdvanceDeductionSchema),
    defaultValues: {
      amount: 0,
      date: minDate || new Date(),
      description: "",
    },
  })

  const onSubmit = async (data: CashAdvanceDeductionFormData) => {
    try {
      // Create a debit movement (cash advance withdrawal)
      // Mark as pending - it will only be applied when payroll is approved
      await createMovement.mutateAsync({
        employee: employeeId,
        movement_type: "debit",
        amount: data.amount.toString(),
        date: format(data.date, "yyyy-MM-dd"),
        description: data.description || "Cash advance deduction from payroll",
        reference: payrollId ? `payroll-${payrollId}` : undefined,
        is_pending: true,
      })

      // Recompute payroll so the cash advance appears as a deduction
      if (payrollId) {
        await recomputePayroll.mutateAsync({})
      }

      form.reset()
      onOpenChange(false)
    } catch {
      // Error handled by useApiMutation
    }
  }

  const isLoading = createMovement.isPending || recomputePayroll.isPending

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Cash Advance Deduction
          </DialogTitle>
          <DialogDescription>
            Record a cash advance deduction for <strong>{employeeName}</strong>.
            {weekStart && weekEnd && (
              <>
                {" "}
                The date must fall within the payroll period ({
                  weekStart
                } to {weekEnd}).
              </>
            )}{" "}
            This will be deducted from their payroll and cash ban balance.
          </DialogDescription>
          {cashBanBalance !== undefined && (
            <div className="mt-2 p-3 bg-muted rounded-lg flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Available Cash Ban Balance:
              </span>
              <span
                className={`font-semibold ${cashBanBalance > 0 ? "text-green-600" : "text-red-600"}`}
              >
                ₱ {cashBanBalance.toLocaleString()}
              </span>
            </div>
          )}
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Amount to deduct as cash advance
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <DatePicker
                      field={{
                        value: field.value,
                        onChange: field.onChange,
                      }}
                      label="Date *"
                      placeholder="Select date"
                      minDate={minDate}
                      maxDate={maxDate}
                      disabled={isLoading}
                      required
                    />
                  </FormControl>
                  <FormDescription>
                    Must be within the payroll period
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description/Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional reason for cash advance deduction..."
                      className="resize-none"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add Cash Advance
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
