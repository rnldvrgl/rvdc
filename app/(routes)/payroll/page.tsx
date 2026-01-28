"use client"
import { useTimeEntries } from "@/lib/queries/usePayroll"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"

import {
  Form,
  FormControl,
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
import { useForm } from "react-hook-form"

import { useCurrentUser } from "@/lib/hooks/useCurrentUser"

import { useTimeEntryMutations } from "@/lib/mutations/payroll/useTimeEntryMutations"

import { TimeEntry } from "@/lib/constants/types"

import { Checkbox } from "@/components/ui/checkbox"

type NewEntryForm = {
  employeeId: string
  clock_in: string // datetime-local
  clock_out: string // datetime-local
  unpaid_break_minutes: number
  approved: boolean
  source: "manual" | "schedule" | "import"
  notes?: string
}

export default function AttendanceAdminPage() {
  const { role } = useCurrentUser()
  const isAdmin = role === "admin"

  const [filters, setFilters] = useState<{
    employee?: string
    start_date?: string
    end_date?: string
  }>({
    employee: "",
    start_date: "",
    end_date: "",
  })

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {}
    if (filters.employee) params.employee = filters.employee
    if (filters.start_date) params.start_date = filters.start_date
    if (filters.end_date) params.end_date = filters.end_date
    // Consider backend expects ISO date range; adjust as needed
    return params
  }, [filters])

  const { data, isLoading, refetch } = useTimeEntries(queryParams)

  const { addTimeEntry } = useTimeEntryMutations()
  const filtersForm = useForm<{
    employee?: string
    start_date?: string
    end_date?: string
  }>({
    defaultValues: {
      employee: filters.employee,
      start_date: filters.start_date,
      end_date: filters.end_date,
    },
  })
  const applyFilters = filtersForm.handleSubmit((values) => {
    setFilters(values)
    refetch()
  })

  const addEntryForm = useForm<NewEntryForm>({
    defaultValues: {
      employeeId: "",
      clock_in: "",
      clock_out: "",
      unpaid_break_minutes: 0,

      approved: true,

      source: "manual",

      notes: "",
    },
  })

  const canManage = isAdmin

  const resetForm = () => addEntryForm.reset()

  const toIsoString = (dtLocal: string) => {
    // dtLocal is "YYYY-MM-DDTHH:MM"
    if (!dtLocal) return dtLocal
    // Construct ISO string in local timezone; your API may prefer UTC Z timestamps.
    const d = new Date(dtLocal)
    return d.toISOString()
  }

  const handleAdd = async (values: NewEntryForm) => {
    if (!canManage) return

    if (!values.employeeId || !values.clock_in || !values.clock_out) return

    await addTimeEntry.mutateAsync({
      employee: Number(values.employeeId),
      clock_in: toIsoString(values.clock_in),
      clock_out: toIsoString(values.clock_out),
      unpaid_break_minutes: Number(values.unpaid_break_minutes || 0),

      approved: values.approved,
      source: values.source,
      notes: values.notes,
    })

    addEntryForm.reset()
    await refetch()
  }

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Attendance — Time Entries</h1>
          <div className="text-xs text-muted-foreground">
            {canManage ? "Admin access" : "View only"}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Add, edit, and delete clock in/out records. These entries feed into
          weekly payroll computations.
        </p>
      </header>

      <section className="p-4 border rounded-lg bg-card shadow-sm">
        <div className="font-medium mb-3">Filters</div>

        <Form {...filtersForm}>
          <form
            onSubmit={applyFilters}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm"
          >
            <FormField
              control={filtersForm.control}
              name="employee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee ID</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={filtersForm.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={filtersForm.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end">
              <Button
                variant="outline"
                type="submit"
              >
                Apply
              </Button>
            </div>
          </form>
        </Form>
      </section>

      <section className="p-4 border rounded-lg bg-card shadow-sm">
        <div className="font-medium mb-3">Add Time Entry</div>

        <Form {...addEntryForm}>
          <form
            onSubmit={addEntryForm.handleSubmit(handleAdd)}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm"
          >
            <FormField
              control={addEntryForm.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee ID</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={!canManage || addTimeEntry.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={addEntryForm.control}
              name="clock_in"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clock In</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      disabled={!canManage || addTimeEntry.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={addEntryForm.control}
              name="clock_out"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clock Out</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      disabled={!canManage || addTimeEntry.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={addEntryForm.control}
              name="unpaid_break_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unpaid Break (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      disabled={!canManage || addTimeEntry.isPending}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(Number(e.target.value || 0))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={addEntryForm.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="schedule">Schedule</SelectItem>
                        <SelectItem value="import">Import</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={addEntryForm.control}
              name="approved"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Approved</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!canManage || addTimeEntry.isPending}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={addEntryForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="md:col-span-3">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      disabled={!canManage || addTimeEntry.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-3 flex items-center gap-2 md:col-span-3">
              <Button
                type="submit"
                disabled={!canManage || addTimeEntry.isPending}
              >
                {addTimeEntry.isPending ? "Adding..." : "Add Entry"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={resetForm}
                disabled={addTimeEntry.isPending}
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </section>

      {/* Entries List */}
      <section className="p-4 border rounded-lg bg-card shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Entries</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-sm">Loading...</div>
        ) : data?.results?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-2">Employee</th>
                  <th className="py-2 pr-2">Clock In</th>
                  <th className="py-2 pr-2">Clock Out</th>
                  <th className="py-2 pr-2">Break (m)</th>
                  <th className="py-2 pr-2">Approved</th>
                  <th className="py-2 pr-2">Source</th>
                  <th className="py-2 pr-2">Notes</th>
                  <th className="py-2 pr-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((e: TimeEntry) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    canManage={canManage}
                    onChanged={refetch}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No entries found.</div>
        )}
      </section>
    </div>
  )
}

function EntryRow({
  entry,
  canManage,
  onChanged,
}: {
  entry: TimeEntry
  canManage: boolean
  onChanged?: () => void
}) {
  const { updateTimeEntry, deleteTimeEntry } = useTimeEntryMutations()

  const [form, setForm] = useState<{
    clock_in: string
    clock_out: string
    unpaid_break_minutes: number
    approved: boolean
    source: "manual" | "schedule" | "import"
    notes?: string
  }>({
    clock_in: toLocalInputValue(entry.clock_in),
    clock_out: toLocalInputValue(entry.clock_out),
    unpaid_break_minutes: entry.unpaid_break_minutes ?? 0,
    approved: Boolean(entry.approved),
    source: entry.source,
    notes: entry.notes || "",
  })

  const busy = updateTimeEntry.isPending || deleteTimeEntry.isPending

  const toIsoString = (dtLocal: string) => {
    if (!dtLocal) return dtLocal
    const d = new Date(dtLocal)
    return d.toISOString()
  }

  const save = async () => {
    if (!canManage) return
    await updateTimeEntry.mutateAsync({
      id: entry.id,
      data: {
        clock_in: form.clock_in ? toIsoString(form.clock_in) : undefined,
        clock_out: form.clock_out ? toIsoString(form.clock_out) : undefined,
        unpaid_break_minutes: Number(form.unpaid_break_minutes || 0),
        approved: form.approved,
        source: form.source,
        notes: form.notes,
      },
    })
    onChanged?.()
  }

  const remove = async () => {
    if (!canManage) return
    if (!confirm("Delete this entry?")) return
    await deleteTimeEntry.mutateAsync(entry.id)
    onChanged?.()
  }

  return (
    <tr className="border-b">
      <td className="py-2 pr-2">{entry.employee}</td>
      <td className="py-2 pr-2">
        <Input
          type="datetime-local"
          className="w-full"
          value={form.clock_in}
          onChange={(e) => setForm((f) => ({ ...f, clock_in: e.target.value }))}
          disabled={!canManage || busy}
        />
      </td>
      <td className="py-2 pr-2">
        <Input
          type="datetime-local"
          className="w-full"
          value={form.clock_out}
          onChange={(e) =>
            setForm((f) => ({ ...f, clock_out: e.target.value }))
          }
          disabled={!canManage || busy}
        />
      </td>
      <td className="py-2 pr-2">
        <Input
          type="number"
          min={0}
          className="w-full"
          value={form.unpaid_break_minutes}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              unpaid_break_minutes: Number(e.target.value || 0),
            }))
          }
          disabled={!canManage || busy}
        />
      </td>
      <td className="py-2 pr-2">
        <Checkbox
          checked={form.approved}
          onCheckedChange={(checked) =>
            setForm((f) => ({ ...f, approved: Boolean(checked) }))
          }
          disabled={!canManage || busy}
        />
      </td>
      <td className="py-2 pr-2">
        <Select
          value={form.source}
          onValueChange={(value) =>
            setForm((f) => ({
              ...f,
              source: value as typeof form.source,
            }))
          }
          disabled={!canManage || busy}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="schedule">Schedule</SelectItem>
            <SelectItem value="import">Import</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="py-2 pr-2">
        <Input
          type="text"
          className="w-full"
          value={form.notes || ""}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          disabled={!canManage || busy}
          placeholder="Add notes..."
        />
      </td>
      <td className="py-2 pr-2">
        <div className="flex items-center gap-2">
          <Button
            onClick={save}
            disabled={!canManage || busy}
          >
            {updateTimeEntry.isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            onClick={remove}
            disabled={!canManage || busy}
          >
            {deleteTimeEntry.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </td>
    </tr>
  )
}

function toLocalInputValue(iso?: string) {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  // datetime-local expects "YYYY-MM-DDTHH:MM"
  return `${year}-${month}-${day}T${hours}:${minutes}`
}
