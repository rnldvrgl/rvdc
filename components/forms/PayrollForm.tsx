"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import DatePicker from "@/components/custom/inputs/DatePicker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { usePayrollMutations } from "@/lib/mutations/usePayrollMutations"
import { useEmployeeChoices } from "@/lib/queries/useChoices"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Info, Loader2, PhilippinePesoIcon } from "lucide-react"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const payrollFormSchema = z
  .object({
    employee: z.coerce.number({
      required_error: "Please select an employee",
    }),
    week_start: z.date({
      required_error: "Please select a week start date",
    }),
    week_end: z.date({
      required_error: "Please select a week end date",
    }),
    notes: z.string().optional(),
  })
  .refine((data) => data.week_end >= data.week_start, {
    message: "Week end must be on or after week start",
    path: ["week_end"],
  })

type PayrollFormValues = z.infer<typeof payrollFormSchema>

interface PayrollFormProps {
  onClose: () => void
}

export default function PayrollForm({ onClose }: PayrollFormProps) {
  // Queries
  const { data: employeesData } = useEmployeeChoices({ includeInPayroll: true })

  const employees = useMemo(() => employeesData ?? [], [employeesData])

  // Mutations
  const { generatePayroll } = usePayrollMutations()

  // Form
  const form = useForm<PayrollFormValues>({
    resolver: zodResolver(payrollFormSchema),
    defaultValues: {
      employee: employeesData?.[0]?.id ?? 0,
      week_start: undefined,
      week_end: undefined,
      notes: "",
    },
  })

  // Set default employee when employees load
  useEffect(() => {
    if (employeesData?.length && form.getValues("employee") === 0) {
      form.setValue("employee", employeesData[0].id)
    }
  }, [employeesData, form])

  const onSubmit = async (data: PayrollFormValues) => {
    const payload = {
      employee_id: data.employee,
      week_start: format(data.week_start, "yyyy-MM-dd"),
      week_end: format(data.week_end, "yyyy-MM-dd"),
      notes: data.notes || "",
      include_unapproved: false,
    }

    try {
      await generatePayroll.mutateAsync(payload)
      onClose()
    } catch {
      // Error is handled by useApiMutation
    }
  }

  const isLoading = generatePayroll.isPending

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Select the payroll period dates and the employee to generate payroll
            for.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {/* Employee Selection */}
          <FormField
            control={form.control}
            name="employee"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Employee</FormLabel>
                <FormControl>
                  <ComboBox
                    disabled={isLoading}
                    value={field.value?.toString() || null}
                    onChange={(value) =>
                      field.onChange(value ? Number(value) : null)
                    }
                    options={
                      employees?.map((employee) => ({
                        value: employee.id.toString(),
                        label: `${employee.first_name} ${employee.last_name}${employee.role ? ` (${employee.role})` : ""}`,
                      })) || []
                    }
                    placeholder="Select employee"
                    searchPlaceholder="Search employees..."
                  />
                </FormControl>
                <FormDescription>
                  Select the employee for payroll generation
                </FormDescription>
              </FormItem>
            )}
          />

          {/* Week Start Date */}
          <FormField
            control={form.control}
            name="week_start"
            render={({ field }) => (
              <DatePicker
                field={field}
                label="Week Start"
                required
                description="Start date of the payroll period"
                placeholder="Select week start date"
                disabled={isLoading}
                maxDate={new Date()}
              />
            )}
          />

          {/* Week End Date */}
          <FormField
            control={form.control}
            name="week_end"
            render={({ field }) => (
              <DatePicker
                field={field}
                label="Week End"
                required
                description="End date of the payroll period"
                placeholder="Select week end date"
                disabled={isLoading}
                minDate={form.watch("week_start") || undefined}
                maxDate={new Date()}
              />
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
                    {...field}
                    disabled={isLoading}
                    placeholder="Add any notes about this payroll..."
                    rows={3}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
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
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <PhilippinePesoIcon className="h-4 w-4" />
                Generate Payroll
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
