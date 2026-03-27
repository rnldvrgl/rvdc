"use client"

import DatePicker from "@/components/custom/inputs/DatePicker"
import { DateTimePicker } from "@/components/custom/inputs/DateTimePicker"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type {
  AttendancePayload,
  AttendanceStatus,
  AttendanceType,
  DailyAttendance,
} from "@/lib/constants/types"
import { useAttendanceMutations } from "@/lib/mutations/useAttendanceMutations"
import { useEmployeeChoices } from "@/lib/queries/useChoices"
import { formatDateToYMD } from "@/lib/utils/helpers"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, Loader2, Sparkles } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const specialAttendanceTypes = ["ABSENT", "LEAVE", "SHOP_CLOSED"] as const

const attendanceFormSchema = z
  .object({
    employee: z.number({ required_error: "Please select an employee" }),
    date: z.date({ required_error: "Please select a date" }),
    clock_in: z.date().optional().nullable(),
    clock_out: z.date().optional().nullable(),
    attendance_type: z.enum([
      "AUTO",
      "FULL_DAY",
      "HALF_DAY",
      "PARTIAL",
      "ABSENT",
      "LEAVE",
      "SHOP_CLOSED",
      "PENDING",
      "INVALID",
    ]),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    missing_uniform_shirt: z.boolean(),
    missing_uniform_pants: z.boolean(),
    missing_uniform_shoes: z.boolean(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const requiresNoClock = specialAttendanceTypes.includes(
      data.attendance_type as (typeof specialAttendanceTypes)[number],
    )

    if (!requiresNoClock && !data.clock_in) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clock_in"],
        message:
          "Clock-in is required unless the record is marked absent, leave, or shop closed.",
      })
    }

    if (data.clock_out && !data.clock_in) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clock_out"],
        message: "Clock-in is required before setting clock-out.",
      })
    }

    if (data.clock_in && data.clock_out && data.clock_out <= data.clock_in) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["clock_out"],
        message: "Clock-out must be after clock-in.",
      })
    }

    if (requiresNoClock && (data.clock_in || data.clock_out)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["attendance_type"],
        message:
          "Absent, leave, and shop-closed records cannot include clock times.",
      })
    }
  })

type AttendanceFormValues = z.infer<typeof attendanceFormSchema>

interface AttendanceFormProps {
  attendance?: DailyAttendance
  initialDate?: Date
  initialEmployeeId?: number
  onClose: () => void
  forceClose?: () => void
}

type AttendanceFormStatus = "PENDING" | "APPROVED" | "REJECTED"

const normalizeFormStatus = (
  status?: AttendanceStatus | null,
): AttendanceFormStatus => {
  if (status === "APPROVED" || status === "REJECTED") {
    return status
  }
  return "PENDING"
}

const buildDefaultValues = ({
  attendance,
  initialDate,
  initialEmployeeId,
}: {
  attendance?: DailyAttendance
  initialDate?: Date
  initialEmployeeId?: number
}): AttendanceFormValues => {
  const attendanceType = attendance
    ? attendance.clock_in || attendance.clock_out
      ? "AUTO"
      : attendance.attendance_type
    : "AUTO"

  return {
    employee: attendance?.employee ?? initialEmployeeId ?? 0,
    date: attendance ? new Date(attendance.date) : (initialDate ?? new Date()),
    clock_in: attendance?.clock_in ? new Date(attendance.clock_in) : null,
    clock_out: attendance?.clock_out ? new Date(attendance.clock_out) : null,
    attendance_type: attendanceType,
    status: normalizeFormStatus(attendance?.status),
    missing_uniform_shirt: attendance?.missing_uniform_shirt ?? false,
    missing_uniform_pants: attendance?.missing_uniform_pants ?? false,
    missing_uniform_shoes: attendance?.missing_uniform_shoes ?? false,
    notes: attendance?.notes ?? "",
  }
}

export default function AttendanceForm({
  attendance,
  initialDate,
  initialEmployeeId,
  onClose,
  forceClose,
}: AttendanceFormProps) {
  const { data: employeeChoices = [] } = useEmployeeChoices({
    includeInPayroll: true,
  })
  const { createAttendance, updateAttendance } = useAttendanceMutations()

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: buildDefaultValues({
      attendance,
      initialDate,
      initialEmployeeId,
    }),
  })

  const attendanceType = form.watch("attendance_type")
  const isComputedType = attendanceType === "AUTO"
  const requiresNoClock = specialAttendanceTypes.includes(
    attendanceType as (typeof specialAttendanceTypes)[number],
  )

  useEffect(() => {
    form.reset(
      buildDefaultValues({
        attendance,
        initialDate,
        initialEmployeeId,
      }),
    )
  }, [attendance, form, initialDate, initialEmployeeId])

  useEffect(() => {
    if (requiresNoClock) {
      form.setValue("clock_in", null)
      form.setValue("clock_out", null)
    }
  }, [form, requiresNoClock])

  useEffect(() => {
    if (
      !attendance &&
      employeeChoices.length > 0 &&
      form.getValues("employee") === 0
    ) {
      form.setValue("employee", initialEmployeeId ?? employeeChoices[0].id)
    }
  }, [attendance, employeeChoices, form, initialEmployeeId])

  const onSubmit = async (values: AttendanceFormValues) => {
    const payload: AttendancePayload = {
      employee: values.employee,
      date: formatDateToYMD(values.date),
      clock_in: values.clock_in ? values.clock_in.toISOString() : null,
      clock_out: values.clock_out ? values.clock_out.toISOString() : null,
      status: values.status,
      missing_uniform_shirt: values.missing_uniform_shirt,
      missing_uniform_pants: values.missing_uniform_pants,
      missing_uniform_shoes: values.missing_uniform_shoes,
      notes: values.notes?.trim() || "",
      attendance_type: isComputedType
        ? undefined
        : (values.attendance_type as AttendanceType),
    }

    try {
      if (attendance) {
        await updateAttendance.mutateAsync({
          id: attendance.id,
          data: payload,
        })
      } else {
        await createAttendance.mutateAsync(payload)
      }

      if (forceClose) forceClose()
      else onClose()
    } catch {
      // handled by mutation hook
    }
  }

  const isPending = createAttendance.isPending || updateAttendance.isPending

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <Alert className="border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100">
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Records with clock times are auto-calculated by the backend for late
            penalties, paid hours, and attendance type. Use a manual type only
            for absence, leave, or shop-closed entries.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="employee"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Employee</FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange(Number.parseInt(value, 10))
                  }
                  value={field.value ? String(field.value) : ""}
                  disabled={!!attendance}
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

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormControl>
                  <DatePicker
                    label="Attendance Date"
                    required
                    field={field}
                    withoutLabel
                    withMessage
                    captionLayout="dropdown-months"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="clock_in"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clock In</FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value ?? undefined}
                    onChange={(date) => field.onChange(date ?? null)}
                    disablePastDates={false}
                    disabled={requiresNoClock}
                    placeholder="Select clock-in time"
                  />
                </FormControl>
                <FormDescription>
                  Leave blank for absences, leave, or shop-closed entries.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clock_out"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clock Out</FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value ?? undefined}
                    onChange={(date) => field.onChange(date ?? null)}
                    disablePastDates={false}
                    disabled={requiresNoClock}
                    placeholder="Select clock-out time"
                  />
                </FormControl>
                <FormDescription>
                  Optional for incomplete records. The admin can save a clock-in
                  first and finish the record later.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="attendance_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Attendance Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="AUTO">
                      Auto-calculate from times
                    </SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="LEAVE">Leave</SelectItem>
                    <SelectItem value="SHOP_CLOSED">Shop Closed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FULL_DAY">Full Day</SelectItem>
                    <SelectItem value="HALF_DAY">Half Day</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="INVALID">Invalid</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Use manual values only when you intentionally want a
                  non-clocked record.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-medium">Uniform penalties</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <FormField
              control={form.control}
              name="missing_uniform_shirt"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(Boolean(checked))
                      }
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="cursor-pointer">
                      Missing shirt
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="missing_uniform_pants"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(Boolean(checked))
                      }
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="cursor-pointer">
                      Missing pants
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="missing_uniform_shoes"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(Boolean(checked))
                      }
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="cursor-pointer">
                      Missing shoes
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={4}
                  placeholder="Add context for adjustments, approvals, exceptions, or audit notes."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {attendance ? "Update Attendance" : "Add Attendance"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
