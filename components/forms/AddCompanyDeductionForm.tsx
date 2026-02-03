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

const companyDeductionSchema = z.object({
  name: z.string().min(1, "Deduction name is required"),
  description: z.string().optional(),
  deduction_type: z.enum(["recurring_all", "onetime_all"]),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  effective_date: z.date({ required_error: "Effective date is required" }),
  end_date: z.date().optional(),
})

type CompanyDeductionFormData = z.infer<typeof companyDeductionSchema>

interface AddCompanyDeductionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deduction?: ManualDeduction | null
}

export function AddCompanyDeductionForm({
  open,
  onOpenChange,
  deduction,
}: AddCompanyDeductionFormProps) {
  const createMutation = useCreateManualDeduction()
  const updateMutation = useUpdateManualDeduction()
  const isEditing = !!deduction

  const form = useForm<CompanyDeductionFormData>({
    resolver: zodResolver(companyDeductionSchema),
    defaultValues: {
      name: "",
      description: "",
      deduction_type: "recurring_all",
      amount: 0,
      effective_date: new Date(),
      end_date: undefined,
    },
  })

  useEffect(() => {
    if (deduction) {
      form.reset({
        name: deduction.name,
        description: deduction.description || "",
        deduction_type: deduction.deduction_type as
          | "recurring_all"
          | "onetime_all",
        amount: Number(deduction.amount),
        effective_date: deduction.effective_date
          ? new Date(deduction.effective_date)
          : new Date(),
        end_date: deduction.end_date ? new Date(deduction.end_date) : undefined,
      })
    } else {
      form.reset({
        name: "",
        description: "",
        deduction_type: "recurring_all",
        amount: 0,
        effective_date: new Date(),
        end_date: undefined,
      })
    }
  }, [deduction, form])

  const deductionType = form.watch("deduction_type")
  const showEndDate = deductionType === "recurring_all"

  const onSubmit = async (data: CompanyDeductionFormData) => {
    try {
      const payload = {
        name: data.name,
        description: data.description || "",
        deduction_type: data.deduction_type,
        amount: Number(data.amount),
        effective_date: format(data.effective_date, "yyyy-MM-dd"),
        end_date: data.end_date
          ? format(data.end_date, "yyyy-MM-dd")
          : undefined,
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

  const getDeductionTypeDescription = (type: string) => {
    switch (type) {
      case "recurring_all":
        return "This deduction will be applied to ALL employees every payroll period"
      case "onetime_all":
        return "This deduction will be applied once to ALL employees on the specified date"
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
          <DialogTitle>
            {isEditing ? "Edit" : "Add"} Company-Wide Deduction
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this deduction that applies to all employees"
              : "Create a new deduction that applies to all employees"}
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
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select deduction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="recurring_all">
                        Recurring for All Employees
                      </SelectItem>
                      <SelectItem value="onetime_all">
                        One-Time for All Employees
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {getDeductionTypeDescription(field.value)}
                  </p>
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
                      placeholder="e.g., Uniform Fee, Company Event, Parking"
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
                  <FormLabel>
                    Amount per{" "}
                    {deductionType === "onetime_all" ? "Employee" : "Payroll"}{" "}
                    (₱)
                  </FormLabel>
                  <FormControl>
                    <Input
                      required
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
                  <p className="text-xs text-muted-foreground">
                    {deductionType === "onetime_all"
                      ? "This amount will be deducted once from each employee"
                      : "This amount will be deducted from each employee per payroll"}
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effective_date"
              render={({ field }) => (
                <DatePicker
                  required
                  field={field}
                  label={
                    deductionType === "onetime_all"
                      ? "Application Date"
                      : "Start Date"
                  }
                  placeholder={
                    deductionType === "onetime_all"
                      ? "When to apply this deduction"
                      : "Select start date"
                  }
                  description={
                    deductionType === "onetime_all"
                      ? "Deduction will be applied on the payroll period containing this date"
                      : "Deduction will start on payrolls from this date forward"
                  }
                  disablePastDates
                />
              )}
            />

            {showEndDate && (
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <DatePicker
                    field={field}
                    required
                    label="End Date"
                    placeholder="Select end date"
                    description="Leave empty for ongoing deduction, or set a date to stop automatically"
                    minDate={form.watch("effective_date")}
                  />
                )}
              />
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

            <div className="text-xs bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md p-3">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Examples:
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                {deductionType === "recurring_all" ? (
                  <>
                    <li>Monthly union dues: ₱50/week</li>
                    <li>Cafeteria subscription: ₱75/week</li>
                    <li>Parking fee: ₱100/week</li>
                  </>
                ) : (
                  <>
                    <li>Company event fee: ₱250 one-time</li>
                    <li>Uniform deposit: ₱500 one-time</li>
                    <li>ID replacement: ₱100 one-time</li>
                  </>
                )}
              </ul>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  onOpenChange(false)
                }}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isEditing ? "Update" : "Add"} Deduction
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
