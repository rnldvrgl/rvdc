"use client"

import DatePicker from "@/components/custom/inputs/DatePicker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { MultiSelect } from "@/components/ui/multi-select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { BulkGeneratePayrollResponse } from "@/lib/mutations/usePayrollMutations"
import { usePayrollMutations } from "@/lib/mutations/usePayrollMutations"
import { useEmployeeChoices } from "@/lib/queries/useChoices"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  SkipForward,
  Users,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const bulkPayrollFormSchema = z
  .object({
    select_all: z.boolean(),
    employee_ids: z.array(z.string()),
    week_start: z.date({
      required_error: "Please select a week start date",
    }),
    week_end: z.date({
      required_error: "Please select a week end date",
    }),
    notes: z.string().optional(),
    include_unapproved: z.boolean(),
  })
  .refine((data) => data.week_end >= data.week_start, {
    message: "Week end must be on or after week start",
    path: ["week_end"],
  })

type BulkPayrollFormValues = z.infer<typeof bulkPayrollFormSchema>

interface BulkGeneratePayrollFormProps {
  onClose: () => void
}

export default function BulkGeneratePayrollForm({
  onClose,
}: BulkGeneratePayrollFormProps) {
  const { data: employeesData } = useEmployeeChoices({ includeInPayroll: true })
  const { bulkGeneratePayroll } = usePayrollMutations()
  const [result, setResult] = useState<BulkGeneratePayrollResponse | null>(null)

  const employees = useMemo(() => employeesData ?? [], [employeesData])

  const employeeOptions = useMemo(
    () =>
      employees.map((emp) => ({
        value: emp.id.toString(),
        label: `${emp.first_name} ${emp.last_name}${emp.role ? ` (${emp.role})` : ""}`,
      })),
    [employees],
  )

  const form = useForm<BulkPayrollFormValues>({
    resolver: zodResolver(bulkPayrollFormSchema),
    defaultValues: {
      select_all: true,
      employee_ids: [],
      week_start: undefined,
      week_end: undefined,
      notes: "",
      include_unapproved: false,
    },
  })

  const selectAll = form.watch("select_all")

  const onSubmit = async (data: BulkPayrollFormValues) => {
    const payload = {
      week_start: format(data.week_start, "yyyy-MM-dd"),
      week_end: format(data.week_end, "yyyy-MM-dd"),
      notes: data.notes || "",
      include_unapproved: data.include_unapproved,
      ...(data.select_all
        ? {}
        : { employee_ids: data.employee_ids.map(Number) }),
    }

    try {
      const response = await bulkGeneratePayroll.mutateAsync(payload)
      if (response && "created_count" in response) {
        setResult(response as BulkGeneratePayrollResponse)
      }
    } catch {
      // Error is handled by useApiMutation
    }
  }

  const isLoading = bulkGeneratePayroll.isPending

  // Show results view
  if (result) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Payroll period: {result.week_start} to {result.week_end}
          </div>

          {/* Summary Badges */}
          <div className="flex flex-wrap gap-2">
            {result.created_count > 0 && (
              <Badge
                variant="default"
                className="bg-green-600"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {result.created_count} Created
              </Badge>
            )}
            {result.skipped_count > 0 && (
              <Badge variant="secondary">
                <SkipForward className="h-3 w-3 mr-1" />
                {result.skipped_count} Skipped
              </Badge>
            )}
            {result.error_count > 0 && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                {result.error_count} Errors
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            {/* Created */}
            {result.created.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Successfully Created
                </p>
                {result.created.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"
                  >
                    <span>{p.employee_name}</span>
                    <span className="text-muted-foreground">
                      ₱{Number(p.net_pay || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Skipped */}
            {result.skipped.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Skipped
                </p>
                {result.skipped.map((s) => (
                  <div
                    key={s.employee_id}
                    className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"
                  >
                    <span>{s.employee_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.reason}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  Errors
                </p>
                {result.errors.map((e) => (
                  <div
                    key={e.employee_id}
                    className="flex items-center justify-between border border-red-200 dark:border-red-800 rounded-md px-3 py-2 text-sm"
                  >
                    <span>{e.employee_name}</span>
                    <span className="text-xs text-red-600 dark:text-red-400">
                      {e.error}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Generate payroll for multiple employees at once. Select the payroll
            period and choose which employees to include.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {/* Week Start Date */}
          <FormField
            control={form.control}
            name="week_start"
            render={({ field }) => (
              <DatePicker
                field={field}
                label="Week Start"
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
                description="End date of the payroll period"
                placeholder="Select week end date"
                disabled={isLoading}
                minDate={form.watch("week_start") || undefined}
                maxDate={new Date()}
              />
            )}
          />

          <Separator />

          {/* Select All Checkbox */}
          <FormField
            control={form.control}
            name="select_all"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked)
                      if (checked) {
                        form.setValue("employee_ids", [])
                      }
                    }}
                    disabled={isLoading}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>All Employees ({employees.length})</FormLabel>
                  <FormDescription>
                    Generate payroll for all employees included in payroll
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Employee Selection (shown when not selecting all) */}
          {!selectAll && (
            <FormField
              control={form.control}
              name="employee_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Employees</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={employeeOptions}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder="Choose employees..."
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length} employee
                    {field.value.length !== 1 ? "s" : ""} selected
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Separator />

          {/* Include Unapproved Attendance */}
          <FormField
            control={form.control}
            name="include_unapproved"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Include Unapproved Attendance</FormLabel>
                  <FormDescription>
                    Include attendance records that haven&apos;t been approved
                    yet
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
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    disabled={isLoading}
                    placeholder="Add any notes about this bulk payroll generation..."
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
                <Users className="h-4 w-4" />
                Bulk Generate
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
