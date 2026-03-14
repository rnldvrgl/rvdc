"use client"

import DatePicker from "@/components/custom/inputs/DatePicker"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { usePayrollAdminMutations } from "@/lib/mutations/usePayrollAdminMutations"
import { PayrollSettings, usePayrollSettings } from "@/lib/queries/usePayroll"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Calculator,
  Calendar as CalendarIcon,
  Clock,
  Loader,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
} from "lucide-react"
import React, { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const payrollSettingsSchema = z.object({
  shift_start: z.string().optional(),
  shift_end: z.string().optional(),
  grace_minutes: z.number().min(0).max(60).optional(),
  clock_out_tolerance_minutes: z.number().min(0).max(60).optional(),
  auto_close_enabled: z.boolean().optional(),
  attendance_system_start_date: z.string().nullable().optional(),
  overtime_multiplier: z.number().min(1).max(5).optional(),
  night_diff_multiplier: z.number().min(0).max(1).optional(),
  cash_ban_contribution_amount: z.number().min(0).optional(),
  cash_ban_enabled: z.boolean().optional(),
  holiday_day_hours: z.number().min(1).max(12).optional(),
  holiday_regular_pct: z.number().min(0).max(5).optional(),
  holiday_special_pct: z.number().min(0).max(2).optional(),
  regular_holiday_no_work_pays: z.boolean().optional(),
  special_holiday_no_work_pays: z.boolean().optional(),
})

type PayrollSettingsForm = z.infer<typeof payrollSettingsSchema>

function toHHMM(value?: string): string {
  if (!value) return ""
  // Expecting "HH:MM" or "HH:MM:SS"; normalize to HH:MM for <input type="time" />
  return value.length >= 5 ? value.slice(0, 5) : value
}

function toHHMMSS(value?: string): string | undefined {
  if (!value) return undefined
  // Convert "HH:MM" to "HH:MM:00" for API
  return value.length === 5 ? `${value}:00` : value
}

interface FieldGroupProps {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}

function FieldGroup({ icon, title, description, children }: FieldGroupProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          {title}
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  )
}

export default function PayrollSettingsPage() {
  const { isAdmin } = useCurrentUser()

  const { data: settings, isLoading, refetch } = usePayrollSettings()

  const { saveSettings } = usePayrollAdminMutations()

  const form = useForm<PayrollSettingsForm>({
    resolver: zodResolver(payrollSettingsSchema),
    defaultValues: {
      shift_start: "",
      shift_end: "",
      grace_minutes: 0,
      clock_out_tolerance_minutes: 30,
      auto_close_enabled: false,
      attendance_system_start_date: null,
      overtime_multiplier: 1.25,
      night_diff_multiplier: 0.1,
      cash_ban_contribution_amount: 100,
      cash_ban_enabled: false,
      holiday_day_hours: 8,
      holiday_regular_pct: 1.0,
      holiday_special_pct: 0.3,
      regular_holiday_no_work_pays: false,
      special_holiday_no_work_pays: false,
    },
  })

  const { formState, reset } = form
  const { isDirty, isSubmitting } = formState

  const canEdit = isAdmin
  const busy = saveSettings.isPending || isSubmitting
  const hasChanges = isDirty

  // Initialize form when settings load
  useEffect(() => {
    if (settings) {
      reset({
        shift_start: toHHMM(settings.shift_start as string),
        shift_end: toHHMM(settings.shift_end as string),
        grace_minutes: settings.grace_minutes ?? 0,
        clock_out_tolerance_minutes: settings.clock_out_tolerance_minutes ?? 30,
        auto_close_enabled: settings.auto_close_enabled ?? false,
        attendance_system_start_date:
          settings.attendance_system_start_date ?? null,
        overtime_multiplier: Number(settings.overtime_multiplier) ?? 1.25,
        night_diff_multiplier: Number(settings.night_diff_multiplier) ?? 0.1,
        cash_ban_contribution_amount:
          Number(settings.cash_ban_contribution_amount) ?? 100,
        cash_ban_enabled: settings.cash_ban_enabled ?? false,
        holiday_day_hours: Number(settings.holiday_day_hours) ?? 8,
        holiday_regular_pct: Number(settings.holiday_regular_pct) ?? 1.0,
        holiday_special_pct: Number(settings.holiday_special_pct) ?? 0.3,
        regular_holiday_no_work_pays:
          settings.regular_holiday_no_work_pays ?? false,
        special_holiday_no_work_pays:
          settings.special_holiday_no_work_pays ?? false,
      })
    }
  }, [settings, reset])

  const handleSubmit = async (values: PayrollSettingsForm) => {
    if (!canEdit) return

    // For time fields, normalize to HH:MM:SS
    const payload: Partial<PayrollSettings> = { ...values }
    if (payload.shift_start)
      payload.shift_start = toHHMMSS(payload.shift_start as string)
    if (payload.shift_end)
      payload.shift_end = toHHMMSS(payload.shift_end as string)

    await saveSettings.mutateAsync(payload)
    await refetch()
  }

  const resetLocal = () => {
    if (settings) {
      reset({
        shift_start: toHHMM(settings.shift_start as string),
        shift_end: toHHMM(settings.shift_end as string),
        grace_minutes: settings.grace_minutes ?? 0,
        clock_out_tolerance_minutes: settings.clock_out_tolerance_minutes ?? 30,
        auto_close_enabled: settings.auto_close_enabled ?? false,
        attendance_system_start_date:
          settings.attendance_system_start_date ?? null,
        overtime_multiplier: Number(settings.overtime_multiplier) ?? 1.25,
        night_diff_multiplier: Number(settings.night_diff_multiplier) ?? 0.1,
        cash_ban_contribution_amount:
          Number(settings.cash_ban_contribution_amount) ?? 100,
        cash_ban_enabled: settings.cash_ban_enabled ?? false,
        holiday_day_hours: Number(settings.holiday_day_hours) ?? 8,
        holiday_regular_pct: Number(settings.holiday_regular_pct) ?? 1.0,
        holiday_special_pct: Number(settings.holiday_special_pct) ?? 0.3,
        regular_holiday_no_work_pays:
          settings.regular_holiday_no_work_pays ?? false,
        special_holiday_no_work_pays:
          settings.special_holiday_no_work_pays ?? false,
      })
    }
  }

  return (
    <Wrapper>
      <PageHeader
        isAdminOnly
        title="Payroll Settings"
        description="Configure global payroll behavior including shift schedules, overtime calculations, and holiday policies."
        breadcrumbs={["Payroll", "Settings"]}
      />

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-muted-foreground">
              <RefreshCw className="size-4 animate-spin" />
              Loading settings...
            </div>
          </CardContent>
        </Card>
      ) : !settings ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex items-center justify-center size-14 rounded-xl bg-muted/60 text-muted-foreground">
                <Settings className="size-7" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium text-foreground">
                  No settings found
                </p>
                <p className="text-sm text-muted-foreground">
                  Payroll settings will be initialized on first configuration
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Shift & Attendance Configuration */}
              <FieldGroup
                icon={<Clock className="size-5" />}
                title="Shift & Attendance"
                description="Define workday boundaries, grace periods for attendance classification, and automatic session management rules."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="shift_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shift Start Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={!canEdit}
                          />
                        </FormControl>
                        <FormDescription>
                          The official start time of the work shift
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shift_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shift End Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={!canEdit}
                          />
                        </FormControl>
                        <FormDescription>
                          The official end time of the work shift
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="grace_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grace Minutes</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={60}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value || 0))
                            }
                            disabled={!canEdit}
                          />
                        </FormControl>
                        <FormDescription>
                          Minutes of tolerance for late arrivals before marking
                          as tardy
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clock_out_tolerance_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clock-Out Tolerance (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={60}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value || 0))
                            }
                            disabled={!canEdit}
                          />
                        </FormControl>
                        <FormDescription>
                          Minutes before shift end that still counts as full day
                          (e.g., 30 = 5:30 PM counts as full day)
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="auto_close_enabled"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auto-Close Sessions</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-3 pt-2">
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              disabled={!canEdit}
                            />
                            <span className="text-sm">
                              {field.value ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Automatically close active sessions at shift end time
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="attendance_system_start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <DatePicker
                            label="Attendance System Start Date"
                            field={{
                              value: field.value
                                ? new Date(field.value)
                                : undefined,
                              onChange: (date: Date | undefined) => {
                                if (!date) {
                                  field.onChange(null)
                                  return
                                }
                                // Format as YYYY-MM-DD
                                const year = date.getFullYear()
                                const month = String(
                                  date.getMonth() + 1,
                                ).padStart(2, "0")
                                const day = String(date.getDate()).padStart(
                                  2,
                                  "0",
                                )
                                field.onChange(`${year}-${month}-${day}`)
                              },
                            }}
                            disabled={!canEdit}
                          />
                        </FormControl>
                        <FormDescription>
                          Date when attendance tracking began (absences
                          won&apos;t be marked before this date)
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </FieldGroup>

              {/* Pay Calculation Multipliers */}
              <FieldGroup
                icon={<Calculator className="size-5" />}
                title="Pay Multipliers"
                description="Configure overtime and night differential rates that apply to payroll calculations."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="overtime_multiplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overtime Multiplier</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={1}
                            max={5}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            disabled={!canEdit}
                          />
                        </FormControl>
                        <FormDescription>
                          Additional pay rate for overtime hours (e.g., 1.25 =
                          +25%)
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="night_diff_multiplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Night Differential</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            max={1}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            disabled={!canEdit}
                          />
                        </FormControl>
                        <FormDescription>
                          Additional pay rate for night shift hours (e.g., 0.10
                          = +10%)
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </FieldGroup>
            </div>

            {/* Cash Ban Contribution */}
            <FieldGroup
              icon={<Calculator className="size-5" />}
              title="Cash Ban Fund Contribution"
              description="Configure automatic cash ban fund contributions for employees when payroll is approved."
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cash_ban_contribution_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contribution Amount</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">₱</span>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value || 0))
                            }
                            disabled={!canEdit}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Fixed amount to contribute per employee per payroll
                        period (e.g., 100.00)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cash_ban_enabled"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enable Cash Ban Contributions</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            disabled={!canEdit}
                          />
                          <span className="text-sm">
                            {field.value ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Automatically add contributions when approving payroll
                        (only for employees with cash ban enabled)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </FieldGroup>

            {/* Holiday Pay Configuration */}
            <FieldGroup
              icon={<CalendarIcon className="size-5" />}
              title="Holiday Pay Configuration"
              description="Configure how holidays affect pay calculations, including rates and policies for different holiday types."
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="holiday_day_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standard Day Hours</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.25"
                          min={1}
                          max={12}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value || 0))
                          }
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormDescription>
                        Standard work hours per day used for holiday pay
                        calculations
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="holiday_regular_pct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regular Holiday Rate</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={5}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormDescription>
                        Pay multiplier for regular holidays (e.g., 1.00 = +100%)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="holiday_special_pct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Holiday Rate</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={2}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          disabled={!canEdit}
                        />
                      </FormControl>
                      <FormDescription>
                        Pay multiplier for special non-working days (e.g., 0.30
                        = +30%)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">
                  Holiday Pay Policies
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="regular_holiday_no_work_pays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regular Holiday No-Work Pay</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              disabled={!canEdit}
                            />
                            <span className="text-sm">
                              {field.value ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Pay employees on regular holidays even when they
                          don&apos;t work
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="special_holiday_no_work_pays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Holiday No-Work Pay</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              disabled={!canEdit}
                            />
                            <span className="text-sm">
                              {field.value ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Pay employees on special holidays even when they
                          don&apos;t work
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </FieldGroup>

            {/* Action Bar */}
            <Card className="bg-muted/30">
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-medium">
                      {hasChanges ? "Unsaved Changes" : "All Changes Saved"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {hasChanges
                        ? "You have unsaved changes"
                        : "Settings are up to date"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasChanges && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={resetLocal}
                        disabled={busy}
                        className="gap-2"
                      >
                        <RotateCcw className="size-4" />
                        Reset
                      </Button>
                    )}

                    <Button
                      type="submit"
                      disabled={!canEdit || busy || !hasChanges}
                      size="sm"
                      className="gap-2"
                    >
                      {busy ? (
                        <>
                          <Loader className="size-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="size-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      )}
    </Wrapper>
  )
}
