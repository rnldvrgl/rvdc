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
import { MultiSelect } from "@/components/ui/multi-select"
import { useAttendanceMutations } from "@/lib/mutations/useAttendanceMutations"
import { useEmployeeChoices } from "@/lib/queries/useChoices"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, UserX } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const markAbsentSchema = z.object({
  employee_ids: z.array(z.string()).min(1, "Select at least one employee"),
  date: z.date({ required_error: "Date is required" }),
})

type MarkAbsentFormValues = z.infer<typeof markAbsentSchema>

export function MarkAbsentDialog() {
  const [open, setOpen] = useState(false)
  const { data: employees } = useEmployeeChoices({ includeInPayroll: true })
  const { markAbsent } = useAttendanceMutations()

  const form = useForm<MarkAbsentFormValues>({
    resolver: zodResolver(markAbsentSchema),
    defaultValues: {
      employee_ids: [],
      date: new Date(),
    },
  })

  // Filter out admins
  const employeeOptions = (employees || [])
    .filter((emp) => emp.role !== "admin")
    .map((emp) => ({
      value: emp.id.toString(),
      label: `${emp.first_name} ${emp.last_name}`,
    }))

  const handleSubmit = async (values: MarkAbsentFormValues) => {
    // Convert Date to YYYY-MM-DD format for API
    const dateString = values.date.toISOString().split("T")[0]

    try {
      await markAbsent.mutateAsync({
        employee_ids: values.employee_ids.map((id) => Number(id)),
        date: dateString,
      })
      form.reset()
      setOpen(false)
    } catch {
      // Error handled by useApiMutation
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      form.reset()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <UserX className="h-4 w-4" />
          Mark Absent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Mark Employees Absent
          </DialogTitle>
          <DialogDescription>
            Select employees to mark as absent for a specific date. Employees
            with approved leave will be automatically marked as on leave
            instead.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Date picker */}
            <FormField
              name="date"
              control={form.control}
              render={({ field }) => (
                <DatePicker
                  field={field}
                  label="Date"
                  placeholder="Select date"
                  withMessage
                />
              )}
            />

            {/* Employee multi-select */}
            <FormField
              name="employee_ids"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employees</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={employeeOptions}
                      selected={field.value ?? []}
                      onChange={(values: string[]) => {
                        field.onChange(values)
                      }}
                      placeholder="Select employees to mark absent"
                      disabled={form.formState.isSubmitting}
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
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
                variant="destructive"
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserX className="h-4 w-4 mr-2" />
                )}
                Mark{" "}
                {form.watch("employee_ids").length > 0
                  ? form.watch("employee_ids").length
                  : ""}{" "}
                Absent
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
