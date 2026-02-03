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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCreateManualDeduction } from "@/lib/mutations/useManualDeductionMutations"
import { zodResolver } from "@hookform/resolvers/zod"
import { addWeeks, format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const manualDeductionSchema = z.object({
  name: z.string().min(1, "Deduction name is required"),
  description: z.string().optional(),
  deduction_type: z.enum(["one_time", "recurring"]),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  effective_date: z.date().optional(),
  number_of_weeks: z.coerce.number().optional(),
})

type ManualDeductionFormData = z.infer<typeof manualDeductionSchema>

interface AddManualDeductionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: number
  employeeName: string
  weekStart?: string // ISO date string for payroll week start
  weekEnd?: string // ISO date string for payroll week end
  payrollId?: number // Optional payroll ID to trigger auto-recompute
}

export function AddManualDeductionForm({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  weekStart,
  weekEnd,
  payrollId,
}: AddManualDeductionFormProps) {
  const createMutation = useCreateManualDeduction(payrollId)

  const form = useForm<ManualDeductionFormData>({
    resolver: zodResolver(manualDeductionSchema),
    defaultValues: {
      name: "",
      description: "",
      deduction_type: "one_time",
      amount: 0,
      effective_date: undefined,
      number_of_weeks: undefined,
    },
  })

  const deductionType = form.watch("deduction_type")
  const effectiveDate = form.watch("effective_date")
  const numberOfWeeks = form.watch("number_of_weeks")

  // Automatically compute end date based on number of weeks for recurring deductions
  const computedEndDate = useMemo(() => {
    if (
      deductionType === "recurring" &&
      numberOfWeeks &&
      numberOfWeeks > 0 &&
      effectiveDate
    ) {
      return addWeeks(effectiveDate, numberOfWeeks)
    }
    return undefined
  }, [deductionType, numberOfWeeks, effectiveDate])

  const onSubmit = async (data: ManualDeductionFormData) => {
    try {
      // Determine effective_date based on deduction type and payroll context
      let effectiveDate: string | undefined

      if (data.deduction_type === "recurring") {
        // For recurring: use weekStart if available (to include in current payroll),
        // otherwise use user-selected date
        if (weekStart) {
          effectiveDate = weekStart
        } else if (data.effective_date) {
          effectiveDate = format(data.effective_date, "yyyy-MM-dd")
        }
      } else if (data.deduction_type === "one_time") {
        // For one_time: use weekEnd if available (to apply to current payroll period)
        // This ensures the deduction is applied to the payroll being viewed
        if (weekEnd) {
          effectiveDate = weekEnd
        }
      }

      const payload = {
        name: data.name,
        description: data.description || "",
        deduction_type: "per_employee" as const,
        employee: employeeId,
        amount: Number(data.amount),
        effective_date: effectiveDate,
        end_date: computedEndDate
          ? format(computedEndDate, "yyyy-MM-dd")
          : undefined,
        is_active: true,
      }

      await createMutation.mutateAsync(payload)
      form.reset()
      onOpenChange(false)
    } catch {
      // error is handled by mutation
    }
  }

  const getDeductionTypeDescription = (type: string) => {
    switch (type) {
      case "one_time":
        return weekStart && weekEnd
          ? `This deduction will be applied once to the current payroll period (${format(new Date(weekStart), "MMM dd")} - ${format(new Date(weekEnd), "MMM dd, yyyy")})`
          : "This deduction will be applied once to the employee's next payroll"
      case "recurring":
        return weekStart && weekEnd
          ? `This deduction will start from the current payroll period (${format(new Date(weekStart), "MMM dd")} - ${format(new Date(weekEnd), "MMM dd, yyyy")}) and continue for the specified number of weeks`
          : "This deduction will be applied to multiple payroll periods"
      default:
        return ""
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Manual Deduction</DialogTitle>
          <DialogDescription className="space-y-2">
            Create a deduction for{" "}
            <span className="font-semibold">{employeeName}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="deduction_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deduction Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="one_time">
                        One-Time Deduction
                      </SelectItem>
                      <SelectItem value="recurring">
                        Recurring Deduction
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    {getDeductionTypeDescription(field.value)}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Deduction Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Loan Repayment, Cash Advance"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Amount per Payroll (₱)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value === "" ? 0 : parseFloat(value))
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    This amount will be deducted from each payroll
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Only show Start Date and Number of Weeks for recurring deductions */}
            {deductionType === "recurring" && (
              <>
                {!weekStart && (
                  <FormField
                    control={form.control}
                    name="effective_date"
                    render={({ field }) => (
                      <DatePicker
                        required
                        field={field}
                        label="Start Date"
                        placeholder="Select start date"
                        description="Deduction will start on payrolls from this date forward"
                        disablePastDates
                      />
                    )}
                  />
                )}

                {weekStart && (
                  <div className="text-sm bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md p-3">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Start Date
                    </p>
                    <p className="text-blue-800 dark:text-blue-200">
                      This recurring deduction will start from the current
                      payroll period:{" "}
                      <span className="font-semibold">
                        {format(new Date(weekStart), "MMM dd")} -{" "}
                        {format(new Date(weekEnd!), "MMM dd, yyyy")}
                      </span>
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="number_of_weeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Number of Weeks</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g., 10"
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value
                            field.onChange(
                              value === "" ? undefined : parseInt(value),
                            )
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {computedEndDate
                          ? `Deduction will end on ${format(computedEndDate, "MMM dd, yyyy")}`
                          : "Enter number of weeks for this deduction"}
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this deduction"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="text-xs bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md p-3">
              <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                {weekStart ? "How it works:" : "Examples:"}
              </p>
              {weekStart ? (
                <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-200">
                  <li>
                    <strong>One-time</strong>: Deducted from this payroll period
                    only
                  </li>
                  <li>
                    <strong>Recurring</strong>: Starts from this payroll and
                    continues for the number of weeks you specify
                  </li>
                </ul>
              ) : (
                <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-200">
                  <li>One-time: Cash advance ₱1,000 (single deduction)</li>
                  <li>Recurring: Loan ₱500/week for 10 weeks</li>
                  <li>Recurring: Equipment damage ₱100/week for 5 weeks</li>
                </ul>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  onOpenChange(false)
                }}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Add Deduction
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
