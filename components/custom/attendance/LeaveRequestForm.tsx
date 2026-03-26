"use client"

import DatePicker from "@/components/custom/inputs/DatePicker"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useLeaveRequestMutations } from "@/lib/mutations/useAttendanceMutations"
import {
  useLeaveRequests,
  useMyLeaveBalance,
} from "@/lib/queries/useAttendance"
import { zodResolver } from "@hookform/resolvers/zod"
import { differenceInCalendarDays, format } from "date-fns"
import { AlertCircle, Loader2, Plus } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const LEAVE_TYPES = [
  { value: "SICK", label: "Sick Leave" },
  { value: "EMERGENCY", label: "Emergency Leave" },
  { value: "SPECIAL", label: "Special Leave" },
]

const leaveRequestSchema = z
  .object({
    leave_type: z.enum(["SICK", "EMERGENCY", "SPECIAL"], {
      required_error: "Please select a leave type",
    }),
    start_date: z.date({
      required_error: "Please select a start date",
    }),
    end_date: z.date({
      required_error: "Please select an end date",
    }),
    is_half_day: z.boolean(),
    shift_period: z.enum(["AM", "PM", "FULL"]),
    reason: z.string().min(10, {
      message: "Reason must be at least 10 characters",
    }),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be on or after start date",
    path: ["end_date"],
  })
  .refine(
    (data) => {
      if (data.is_half_day) {
        const days =
          differenceInCalendarDays(data.end_date, data.start_date) + 1
        return days === 1
      }
      return true
    },
    {
      message: "Half-day leave is only allowed for single-day requests",
      path: ["is_half_day"],
    },
  )

type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>

export function LeaveRequestForm() {
  const { user_id } = useCurrentUser()
  const [open, setOpen] = useState(false)
  const { createLeaveRequest } = useLeaveRequestMutations()

  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leave_type: "SICK",
      is_half_day: false,
      shift_period: "FULL",
      reason: "",
    },
  })

  const isHalfDay = form.watch("is_half_day")
  const startDate = form.watch("start_date")
  const endDate = form.watch("end_date")
  const leaveType = form.watch("leave_type")

  // Calculate total days requested
  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0
    if (endDate < startDate) return 0
    const days = differenceInCalendarDays(endDate, startDate) + 1
    if (isHalfDay && days === 1) return 0.5
    return days
  }, [startDate, endDate, isHalfDay])

  // Get leave balance
  const { data: leaveBalance } = useMyLeaveBalance({ enabled: !!open })

  // Get remaining balance for selected leave type
  const remainingBalance = useMemo(() => {
    if (!leaveBalance) return null
    if (leaveType === "SPECIAL") return null // No balance tracking for special leave
    if (leaveType === "SICK")
      return parseFloat(leaveBalance.sick_leave_remaining?.toString() || "0")
    if (leaveType === "EMERGENCY")
      return parseFloat(
        leaveBalance.emergency_leave_remaining?.toString() || "0",
      )
    return null
  }, [leaveBalance, leaveType])

  const isInsufficientBalance =
    remainingBalance !== null && totalDays > remainingBalance

  // Get user's existing leave requests to disable those dates
  const { data: myLeaves } = useLeaveRequests({
    filter: { employee_id: user_id, status__in: "PENDING,APPROVED" },
  })

  // Get dates that should be disabled (already have leave)
  const disabledDates = useMemo(() => {
    if (!myLeaves?.results) return []
    const dates: Date[] = []
    for (const leave of myLeaves.results.filter(
      (l) => l.status === "PENDING" || l.status === "APPROVED",
    )) {
      if (leave.start_date && leave.end_date) {
        const start = new Date(leave.start_date)
        const end = new Date(leave.end_date)
        const current = new Date(start)
        while (current <= end) {
          dates.push(new Date(current))
          current.setDate(current.getDate() + 1)
        }
      } else {
        dates.push(new Date(leave.date))
      }
    }
    return dates
  }, [myLeaves])

  // Auto-sync end_date when start_date changes
  useEffect(() => {
    if (startDate && (!endDate || endDate < startDate)) {
      form.setValue("end_date", startDate)
    }
  }, [startDate, endDate, form])

  // Reset half day when multi-day
  useEffect(() => {
    if (startDate && endDate) {
      const days = differenceInCalendarDays(endDate, startDate) + 1
      if (days > 1 && isHalfDay) {
        form.setValue("is_half_day", false)
        form.setValue("shift_period", "FULL")
      }
    }
  }, [startDate, endDate, isHalfDay, form])

  const isSingleDay = useMemo(() => {
    if (!startDate || !endDate) return true
    return differenceInCalendarDays(endDate, startDate) === 0
  }, [startDate, endDate])

  const onSubmit = async (data: LeaveRequestFormValues) => {
    // Auto-set shift_period based on is_half_day
    const shift_period = data.is_half_day ? data.shift_period : "FULL"

    try {
      await createLeaveRequest.mutateAsync({
        employee: user_id,
        leave_type: data.leave_type,
        start_date: format(data.start_date, "yyyy-MM-dd"),
        end_date: format(data.end_date, "yyyy-MM-dd"),
        is_half_day: data.is_half_day,
        shift_period: shift_period,
        reason: data.reason,
      })
      setOpen(false)
      form.reset()
    } catch {
      // Error is handled by useApiMutation
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Request Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Leave</DialogTitle>
          <DialogDescription>
            Submit a leave request for approval. You can request single or
            multiple days.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Leave Type */}
            <FormField
              control={form.control}
              name="leave_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LEAVE_TYPES.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {remainingBalance !== null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Remaining:{" "}
                      <span
                        className={
                          isInsufficientBalance
                            ? "text-destructive font-medium"
                            : "font-medium"
                        }
                      >
                        {remainingBalance} day(s)
                      </span>
                    </p>
                  )}
                </FormItem>
              )}
            />

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <DatePicker
                    field={field}
                    label="Start Date"
                    disablePastDates={true}
                    disabledDates={disabledDates}
                    withMessage
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
                    disablePastDates={true}
                    disabledDates={disabledDates}
                    withMessage
                  />
                )}
              />
            </div>

            {/* Days Summary */}
            {totalDays > 0 && (
              <div className="rounded-lg border p-3 bg-muted/50">
                <p className="text-sm font-medium">Total: {totalDays} day(s)</p>
                {isInsufficientBalance && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    Insufficient leave balance
                  </p>
                )}
              </div>
            )}

            {/* Half Day - Only show for single day */}
            {isSingleDay && (
              <FormField
                control={form.control}
                name="is_half_day"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          if (!checked) {
                            form.setValue("shift_period", "FULL")
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Half day leave</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Shift Period - Only show when half day is selected */}
            {isHalfDay && isSingleDay && (
              <FormField
                control={form.control}
                name="shift_period"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Which shift are you leaving?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="AM"
                            id="am"
                          />
                          <Label
                            htmlFor="am"
                            className="font-normal cursor-pointer"
                          >
                            Morning Shift
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="PM"
                            id="pm"
                          />
                          <Label
                            htmlFor="pm"
                            className="font-normal cursor-pointer"
                          >
                            Afternoon Shift
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a reason for your leave request..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createLeaveRequest.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLeaveRequest.isPending || isInsufficientBalance}
              >
                {createLeaveRequest.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
