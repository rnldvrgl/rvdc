"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEmployeeChoices } from "@/lib/queries/useChoices"
import { OvertimeRequest } from "@/lib/queries/useOvertimeRequests"
import {
  OvertimeRequestFormData,
  overtimeRequestSchema,
} from "@/lib/schemas/overtimeRequestSchema"
import { cn } from "@/lib/utils/helpers"

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

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {isAdmin && (
          <FormField
            control={form.control}
            name="employee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee *</FormLabel>
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(value) =>
                    field.onChange(Number.parseInt(value, 10))
                  }
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employeeChoices.map((employee) => (
                      <SelectItem
                        key={employee.id}
                        value={String(employee.id)}
                      >
                        {employee.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Date */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>The date you worked overtime</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Time Start */}
        <FormField
          control={form.control}
          name="time_start"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="datetime-local"
                    value={
                      field.value
                        ? format(field.value, "yyyy-MM-dd'T'HH:mm")
                        : ""
                    }
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </FormControl>
              <FormDescription>
                When you started working overtime
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Time End */}
        <FormField
          control={form.control}
          name="time_end"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Time *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="datetime-local"
                    value={
                      field.value
                        ? format(field.value, "yyyy-MM-dd'T'HH:mm")
                        : ""
                    }
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </FormControl>
              <FormDescription>
                When you finished working overtime
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
