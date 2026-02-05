"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import DatePicker from "@/components/custom/inputs/DatePicker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useEmployeeBenefitOverrideMutations } from "@/lib/mutations/useEmployeeBenefitOverrideMutations"
import { useEmployeeChoices } from "@/lib/queries/useChoices"
import { useEmployeeBenefitOverrides } from "@/lib/queries/useEmployeeBenefitOverrides"
import type {
  EmployeeBenefitOverride,
  EmployeeBenefitOverrideFormData,
} from "@/lib/schemas/employeeBenefitOverrideSchema"
import { employeeBenefitOverrideSchema } from "@/lib/schemas/employeeBenefitOverrideSchema"
import { formatDateToYMD } from "@/lib/utils/helpers"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { AlertCircle, Info, Pencil, Trash2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

interface EmployeeBenefitOverrideFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  override?: EmployeeBenefitOverride | null
  preselectedEmployee?: number
}

const benefitTypeOptions = [
  { value: "sss", label: "SSS" },
  { value: "philhealth", label: "PhilHealth" },
  { value: "pagibig", label: "Pag-IBIG / HDMF" },
  { value: "bir_tax", label: "BIR Withholding Tax" },
]

export function EmployeeBenefitOverrideForm({
  open,
  onOpenChange,
  override,
  preselectedEmployee,
}: EmployeeBenefitOverrideFormProps) {
  const { createOverride, updateOverride, deleteOverride } =
    useEmployeeBenefitOverrideMutations()
  const { data: employees = [] } = useEmployeeChoices()
  const isEditing = !!override

  // Fetch existing overrides for the selected employee
  const selectedEmployeeId = preselectedEmployee || override?.employee
  const { data: existingOverridesData } = useEmployeeBenefitOverrides({
    employee: selectedEmployeeId,
    is_active: true,
    enabled: !!selectedEmployeeId,
  })

  const existingOverrides = existingOverridesData?.results || []

  const form = useForm<EmployeeBenefitOverrideFormData>({
    resolver: zodResolver(employeeBenefitOverrideSchema),
    defaultValues: {
      employee: preselectedEmployee || undefined,
      benefit_type: "sss",
      employee_share_amount: 0,
      employer_share_amount: null,
      effective_start: new Date(),
      effective_end: undefined,
      is_active: true,
      notes: "",
    },
  })

  useEffect(() => {
    if (override) {
      form.reset({
        employee: override.employee,
        benefit_type: override.benefit_type,
        employee_share_amount: Number(override.employee_share_amount),
        employer_share_amount: override.employer_share_amount
          ? Number(override.employer_share_amount)
          : undefined,
        effective_start: new Date(override.effective_start),
        effective_end: override.effective_end
          ? new Date(override.effective_end)
          : undefined,
        is_active: override.is_active,
        notes: override.notes || "",
      })
    } else if (preselectedEmployee) {
      // Reset to default values with new employee when preselectedEmployee changes
      form.reset({
        employee: preselectedEmployee,
        benefit_type: "sss",
        employee_share_amount: 0,
        employer_share_amount: null,
        effective_start: new Date(),
        effective_end: undefined,
        is_active: true,
        notes: "",
      })
    }
  }, [override, preselectedEmployee, form])

  const onSubmit = (data: EmployeeBenefitOverrideFormData) => {
    const payload = {
      employee: data.employee,
      benefit_type: data.benefit_type,
      employee_share_amount: data.employee_share_amount,
      employer_share_amount: data.employer_share_amount ?? undefined,
      effective_start: formatDateToYMD(data.effective_start),
      effective_end: data.effective_end
        ? formatDateToYMD(data.effective_end)
        : undefined,
      is_active: data.is_active,
      notes: data.notes,
    }

    if (isEditing && override?.id) {
      updateOverride.mutate(
        { id: override.id, data: payload },
        {
          onSuccess: () => {
            onOpenChange(false)
            form.reset()
          },
        },
      )
    } else {
      createOverride.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false)
          form.reset()
        },
      })
    }
  }

  const employeeOptions = employees.map((emp) => ({
    value: emp.id.toString(),
    label: `${emp.first_name} ${emp.last_name}`,
  }))

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Benefit Override" : "Create Benefit Override"}
          </DialogTitle>
          <DialogDescription>
            Set custom government benefit amounts for individual employees who
            have special arrangements.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Overrides take precedence over standard GovernmentBenefit and
                TaxBracket calculations. Use for employees with custom benefit
                arrangements (e.g., owners, contractors).
              </AlertDescription>
            </Alert>

            {/* Existing Overrides */}
            {!isEditing && existingOverrides.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Existing Overrides</CardTitle>
                  <CardDescription>
                    Active benefit overrides for this employee
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {existingOverrides.map((override) => (
                    <div
                      key={override.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {override.benefit_type_display}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Employee: ₱{override.employee_share_amount}/week
                          {override.employer_share_amount &&
                            ` | Employer: ₱${override.employer_share_amount}/week`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(override.effective_start),
                            "MMM d, yyyy",
                          )}
                          {override.effective_end &&
                            ` - ${format(new Date(override.effective_end), "MMM d, yyyy")}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            form.reset({
                              employee: override.employee,
                              benefit_type: override.benefit_type,
                              employee_share_amount: Number(
                                override.employee_share_amount,
                              ),
                              employer_share_amount:
                                override.employer_share_amount
                                  ? Number(override.employer_share_amount)
                                  : null,
                              effective_start: new Date(
                                override.effective_start,
                              ),
                              effective_end: override.effective_end
                                ? new Date(override.effective_end)
                                : undefined,
                              is_active: override.is_active,
                              notes: override.notes || "",
                            })
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm(
                                `Delete ${override.benefit_type_display} override?`,
                              )
                            ) {
                              deleteOverride.mutate(override.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Validation Warning */}
            {!isEditing &&
              form.watch("benefit_type") &&
              existingOverrides.some(
                (o) => o.benefit_type === form.watch("benefit_type"),
              ) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    An override for{" "}
                    {
                      benefitTypeOptions.find(
                        (b) => b.value === form.watch("benefit_type"),
                      )?.label
                    }{" "}
                    already exists for this employee. Edit the existing override
                    instead of creating a new one.
                  </AlertDescription>
                </Alert>
              )}

            {/* Employee Selection */}
            <FormField
              control={form.control}
              name="employee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee *</FormLabel>
                  <FormControl>
                    <ComboBox
                      options={employeeOptions}
                      value={field.value?.toString() || ""}
                      onChange={(value) => field.onChange(Number(value))}
                      placeholder="Select employee"
                      searchPlaceholder="Search employees..."
                      disabled={isEditing || !!preselectedEmployee}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Benefit Type */}
            <FormField
              control={form.control}
              name="benefit_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benefit Type *</FormLabel>
                  <FormControl>
                    <ComboBox
                      options={benefitTypeOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select benefit type"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employee_share_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee Share (Weekly) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Fixed weekly amount</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employer_share_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employer Share (Weekly)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>For reporting only</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effective_start"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <DatePicker
                        label="Effective Start "
                        required
                        field={{
                          value: field.value,
                          onChange: field.onChange,
                        }}
                        placeholder="Select start date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effective_end"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <DatePicker
                        label="Effective End"
                        field={{
                          value: field.value || undefined,
                          onChange: field.onChange,
                        }}
                        placeholder="Leave empty for no end"
                      />
                    </FormControl>
                    <FormDescription>Leave empty for ongoing</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Active Status */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Uncheck to temporarily disable this override
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Reason for override or special notes..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createOverride.isPending || updateOverride.isPending}
              >
                {isEditing ? "Update Override" : "Create Override"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
