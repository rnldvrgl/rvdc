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
import {
  useCreateManualDeduction,
  useUpdateManualDeduction,
} from "@/lib/mutations/useManualDeductionMutations"
import { ManualDeduction } from "@/lib/schemas/manualDeductionSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const manualDeductionSchema = z.object({
  name: z.string().min(1, "Deduction name is required"),
  description: z.string().optional(),
  deduction_type: z.enum(["one_time", "recurring"]),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  effective_date: z.date().optional(),
  end_date: z.date().optional(),
})

type ManualDeductionFormData = z.infer<typeof manualDeductionSchema>

interface AddManualDeductionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: number
  employeeName: string
  weekStart?: string
  weekEnd?: string
  payrollId?: number
  deduction?: ManualDeduction | null
}

export function AddManualDeductionForm({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  weekStart,
  weekEnd,
  payrollId,
  deduction,
}: AddManualDeductionFormProps) {
  const createMutation = useCreateManualDeduction(payrollId)
  const updateMutation = useUpdateManualDeduction()
  const isEditing = !!deduction

  const form = useForm<ManualDeductionFormData>({
    resolver: zodResolver(manualDeductionSchema),
    defaultValues: {
      name: "",
      description: "",
      deduction_type: "one_time",
      amount: 0,
      effective_date: undefined,
      end_date: undefined,
    },
  })

  useEffect(() => {
    if (deduction) {
      form.reset({
        name: deduction.name,
        description: deduction.description || "",
        deduction_type: deduction.is_recurring ? "recurring" : "one_time",
        amount: Number(deduction.amount),
        effective_date: deduction.effective_date
          ? new Date(deduction.effective_date)
          : undefined,
        end_date: deduction.end_date ? new Date(deduction.end_date) : undefined,
      })
    } else {
      form.reset({
        name: "",
        description: "",
        deduction_type: "one_time",
        amount: 0,
        effective_date: undefined,
        end_date: undefined,
      })
    }
  }, [deduction, form])

  const deductionType = form.watch("deduction_type")

  const onSubmit = async (data: ManualDeductionFormData) => {
    try {
      let effectiveDate: string | undefined

      if (data.deduction_type === "recurring") {
        if (weekStart && !isEditing) {
          effectiveDate = weekStart
        } else if (data.effective_date) {
          effectiveDate = format(data.effective_date, "yyyy-MM-dd")
        }
      } else if (data.deduction_type === "one_time") {
        if (weekEnd && !isEditing) {
          effectiveDate = weekEnd
        } else if (data.effective_date) {
          effectiveDate = format(data.effective_date, "yyyy-MM-dd")
        }
      }

      const payload = {
        name: data.name,
        description: data.description || "",
        deduction_type: "per_employee" as const,
        employee: employeeId,
        amount: Number(data.amount),
        effective_date: effectiveDate,
        end_date: data.end_date
          ? format(data.end_date, "yyyy-MM-dd")
          : undefined,
        is_recurring: data.deduction_type === "recurring",
        is_active: true,
      }

      if (isEditing) {
        await updateMutation.mutateAsync({ id: deduction.id, ...payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      form.reset()
      onOpenChange(false)
    } catch {
      // error is handled by mutation
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit" : "Add"} Manual Deduction
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update" : "Create a"} deduction for{" "}
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
                  <FormLabel required>Deduction Type</FormLabel>
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
                    {deductionType === "one_time"
                      ? "Deducted once from a single payroll"
                      : "Deducted every payroll until the end date (or indefinitely if no end date)"}
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
                </FormItem>
              )}
            />

            {deductionType === "recurring" && (
              <>
                <FormField
                  control={form.control}
                  name="effective_date"
                  render={({ field }) => (
                    <DatePicker
                      required
                      field={field}
                      label="Start Date"
                      placeholder="Select start date"
                      description="When to start applying this deduction"
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <DatePicker
                      field={field}
                      label="End Date"
                      placeholder="No end date (ongoing)"
                      description="Leave blank for indefinite recurring deduction"
                      minDate={form.watch("effective_date")}
                    />
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
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  onOpenChange(false)
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Update" : "Add"} Deduction
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
