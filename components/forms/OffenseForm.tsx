"use client"

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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Offense } from "@/lib/constants/types"
import { useOffenseMutations } from "@/lib/mutations/useAttendanceMutations"
import { useEmployees } from "@/lib/queries/useEmployees"
import { formatDateToYMD } from "@/lib/utils/helpers"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Clock,
  Info,
  Loader2,
  Shield,
  UserX,
} from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const offenseFormSchema = z
  .object({
    employee: z.number({
      required_error: "Please select an employee",
    }),
    offense_type: z.enum(["AWOL", "LATE", "CURFEW", "OTHER"], {
      required_error: "Please select an offense type",
    }),
    date: z.date().min(new Date(0), "Date is required"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    penalty_days: z.number().min(0).optional(),
    suspension_start_date: z.date().optional().nullable(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // If suspension fields are filled, both must be present
      if (data.penalty_days || data.suspension_start_date) {
        return data.penalty_days && data.suspension_start_date
      }
      return true
    },
    {
      message:
        "Both suspension days and start date are required for suspensions",
      path: ["suspension_start_date"],
    },
  )

type OffenseFormValues = z.infer<typeof offenseFormSchema>

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "WARNING":
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    case "SUSPENSION":
      return <Ban className="h-4 w-4 text-orange-600" />
    case "TERMINATION":
      return <UserX className="h-4 w-4 text-red-600" />
    default:
      return <Shield className="h-4 w-4" />
  }
}

interface OffenseFormProps {
  offense?: Offense
  onClose: () => void
  forceClose?: () => void
}

export default function OffenseForm({
  offense,
  onClose,
  forceClose,
}: OffenseFormProps) {
  // Queries
  const { data: employees } = useEmployees()

  // Mutations
  const { createOffense, updateOffense } = useOffenseMutations()

  // Form
  const form = useForm<OffenseFormValues>({
    resolver: zodResolver(offenseFormSchema),
    defaultValues: {
      employee: offense ? offense.employee : employees?.results[0]?.id || 0,
      offense_type: offense ? offense.offense_type : "AWOL",
      date: offense ? new Date(offense.date) : new Date(),
      description: offense ? offense.description : "",
      penalty_days: offense ? offense.penalty_days || 0 : 0,
      suspension_start_date:
        offense && offense.suspension_start_date
          ? new Date(offense.suspension_start_date)
          : null,
      notes: offense ? offense.notes : "",
    },
  })

  // Set default employee when employees load
  useEffect(() => {
    if (
      employees?.results &&
      employees.results.length > 0 &&
      !offense &&
      form.getValues("employee") === 0
    ) {
      form.setValue("employee", employees.results[0].id)
    }
  }, [employees, offense, form])

  const onSubmit = async (data: OffenseFormValues) => {
    const payload = {
      employee: data.employee,
      offense_type: data.offense_type,
      date: formatDateToYMD(data.date),
      description: data.description,
      penalty_days: data.penalty_days || 0,
      suspension_start_date: data.suspension_start_date
        ? formatDateToYMD(data.suspension_start_date)
        : null,
      notes: data.notes || "",
    }

    try {
      if (offense) {
        // When editing, only send changed fields (offense_type will be ignored by backend)
        await updateOffense.mutateAsync({
          id: offense.id,
          data: payload,
        })
      } else {
        // When creating, severity is auto-calculated by backend
        await createOffense.mutateAsync(payload)
      }
      if (forceClose) forceClose()
      else onClose()
    } catch {
      // Error is handled by useApiMutation
    }
  }

  const isPending = createOffense.isPending || updateOffense.isPending

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Edit Mode Info */}
        {offense && (
          <Alert className="border-blue-200 bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 dark:border-blue-800">
            {getSeverityIcon(offense.severity_level)}
            <AlertDescription className="text-sm">
              <div className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                Editing Offense - {offense.severity_level_display}
              </div>
              <div className="text-blue-700 dark:text-blue-300 text-xs">
                Offense type cannot be changed. Severity is managed
                automatically by the system.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Auto-Severity Info for New Offense */}
        {!offense && (
          <Alert className="border-emerald-200 bg-linear-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 dark:border-emerald-800">
            <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <AlertDescription className="text-sm">
              <div className="font-semibold text-emerald-900 dark:text-emerald-200 mb-1">
                Automatic Severity Assignment
              </div>
              <div className="text-emerald-700 dark:text-emerald-300 text-xs space-y-1">
                <div>• 1st offense → Warning</div>
                <div>• 2nd offense → Suspension (requires days & date)</div>
                <div>• 3rd offense → Termination</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employee */}
          <FormField
            control={form.control}
            name="employee"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Employee</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString() || ""}
                  disabled={!!offense}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees?.results.map((emp) => (
                      <SelectItem
                        key={emp.id}
                        value={emp.id.toString()}
                      >
                        {emp.first_name} {emp.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Offense Type */}
          <FormField
            control={form.control}
            name="offense_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Offense Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!!offense}
                >
                  <FormControl>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="AWOL">
                      <div className="flex items-center gap-2">
                        <UserX className="h-4 w-4 text-red-500" />
                        <span className="font-medium">
                          Absent Without Leave
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="LATE">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">Late Arrival</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="CURFEW">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">Curfew Violation</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="OTHER">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Other Violation</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        {/* Date */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormControl>
                <DatePicker
                  label="Date of Offense"
                  required
                  field={field}
                  withMinMaxDate
                  maxDate={new Date()}
                  withoutLabel
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel
                required
                className="text-base font-semibold"
              >
                Description
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide a detailed description of the offense..."
                  {...field}
                  rows={4}
                  className="resize-none"
                />
              </FormControl>
              <FormDescription>
                Clear explanation of the violation (minimum 10 characters)
              </FormDescription>
            </FormItem>
          )}
        />

        {/* Suspension Details - Show for SUSPENSION severity only when editing */}
        {offense?.severity_level === "SUSPENSION" && (
          <div className="space-y-4 p-6 border-2 rounded-xl bg-linear-to-br from-orange-50 via-orange-50 to-orange-100 dark:from-orange-950/20 dark:via-orange-950/10 dark:to-orange-900/20 border-orange-300 dark:border-orange-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Ban className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="font-bold text-lg text-orange-900 dark:text-orange-200">
                Suspension Details
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Penalty Days */}
              <FormField
                control={form.control}
                name="penalty_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Suspension Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Days without pay"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>Number of days suspended</FormDescription>
                  </FormItem>
                )}
              />

              {/* Start Date */}
              <FormField
                control={form.control}
                name="suspension_start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormControl>
                      <DatePicker
                        required
                        label="Start Date"
                        field={{
                          ...field,
                          value: field.value || undefined,
                          onChange: (date) => field.onChange(date || null),
                        }}
                        placeholder="Select start date"
                        captionLayout="dropdown-months"
                      />
                    </FormControl>
                    <FormDescription>When suspension begins</FormDescription>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">
                Additional Notes
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional context, actions taken, or follow-up required..."
                  {...field}
                  rows={3}
                  className="resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
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
            {offense ? "Update Offense" : "Record Offense"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
