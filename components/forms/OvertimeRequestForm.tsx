"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Clock3, Sparkles } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

import { EmployeeCardSelect } from "@/components/custom/inputs/EmployeeCardSelect"
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
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEmployeeChoices } from "@/lib/queries/useChoices"
import { OvertimeRequest } from "@/lib/queries/useOvertimeRequests"
import {
  OvertimeRequestFormData,
  overtimeRequestSchema,
} from "@/lib/schemas/overtimeRequestSchema"

interface OvertimeRequestFormProps {
  overtimeRequest?: OvertimeRequest
  onSubmit: (data: OvertimeRequestFormData) => void
  isLoading?: boolean
}

export function OvertimeRequestForm({
  overtimeRequest,
  onSubmit,
  isLoading,
}: OvertimeRequestFormProps) {
  const { user_id, isAdmin } = useCurrentUser()
  const { data: employeeChoices = [] } = useEmployeeChoices({
    includeInPayroll: true,
  })

  const form = useForm<OvertimeRequestFormData>({
    resolver: zodResolver(overtimeRequestSchema),
    defaultValues: {
      employee: user_id,
      date: overtimeRequest ? new Date(overtimeRequest.date) : undefined,
      time_start: overtimeRequest
        ? new Date(overtimeRequest.time_start)
        : undefined,
      time_end: overtimeRequest
        ? new Date(overtimeRequest.time_end)
        : undefined,
      reason: overtimeRequest?.reason || "",
    },
  })

  useEffect(() => {
    if (overtimeRequest) {
      form.reset({
        employee: overtimeRequest.employee,
        date: new Date(overtimeRequest.date),
        time_start: new Date(overtimeRequest.time_start),
        time_end: new Date(overtimeRequest.time_end),
        reason: overtimeRequest.reason,
      })
      return
    }

    if (isAdmin && employeeChoices.length > 0) {
      const selectedEmployee = form.getValues("employee")
      if (!selectedEmployee) {
        form.setValue("employee", employeeChoices[0].id)
      }
    }
  }, [overtimeRequest, form, isAdmin, employeeChoices])

  const combineDateAndTime = (date: Date, time: Date) => {
    const merged = new Date(date)
    merged.setHours(time.getHours(), time.getMinutes(), 0, 0)
    return merged
  }

  const handleSubmit = (values: OvertimeRequestFormData) => {
    const start = combineDateAndTime(values.date, values.time_start)
    const end = combineDateAndTime(values.date, values.time_end)

    onSubmit({
      ...values,
      time_start: start,
      time_end: end,
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <Alert className="border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100">
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Pick the overtime date first, then choose start and end time.
            This keeps entries fast and avoids datetime mistakes.
          </AlertDescription>
        </Alert>

        {isAdmin && (
          <FormField
            control={form.control}
            name="employee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee *</FormLabel>
                <FormControl>
                  <EmployeeCardSelect
                    employees={employeeChoices}
                    selected={field.value ? [field.value] : []}
                    onChange={(selectedEmployees) => {
                      const selectedEmployee = selectedEmployees[0]
                      if (selectedEmployee) {
                        field.onChange(selectedEmployee)
                      }
                    }}
                    singleSelect
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid gap-4 rounded-xl border border-border/60 bg-card p-4 md:grid-cols-2 md:p-5">
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <DatePicker
                  label="Overtime Date"
                  required
                  field={field}
                  mode="date"
                  withMessage
                  description="Select the date this overtime happened."
                  captionLayout="dropdown-months"
                />
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="time_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time *</FormLabel>
                <FormControl>
                  <DatePicker
                    field={{
                      value: field.value,
                      onChange: field.onChange,
                    }}
                    mode="time"
                    withoutLabel
                    withMessage
                    placeholder="Select start time"
                    minuteStep={5}
                  />
                </FormControl>
                <FormDescription>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    Time when overtime work started.
                  </span>
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time_end"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time *</FormLabel>
                <FormControl>
                  <DatePicker
                    field={{
                      value: field.value,
                      onChange: field.onChange,
                    }}
                    mode="time"
                    withoutLabel
                    withMessage
                    placeholder="Select end time"
                    minuteStep={5}
                  />
                </FormControl>
                <FormDescription>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    Time when overtime work ended.
                  </span>
                </FormDescription>
              </FormItem>
            )}
          />
        </div>

        {/* Reason */}
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Explain why overtime was necessary..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional: Provide context for your overtime request
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading
              ? "Submitting..."
              : overtimeRequest
                ? "Update Request"
                : "Submit Request"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
