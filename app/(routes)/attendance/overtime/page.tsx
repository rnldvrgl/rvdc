"use client"

import { Clock, Plus, X } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { OvertimeRequestForm } from "@/components/forms/OvertimeRequestForm"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import {
  useApproveOvertimeRequest,
  useCreateOvertimeRequest,
  useDeleteOvertimeRequest,
  useUpdateOvertimeRequest,
  type CreateOvertimeRequestInput,
} from "@/lib/mutations/useOvertimeMutations"
import { useEmployeeChoices } from "@/lib/queries/useChoices"
import { useOvertimeRequests } from "@/lib/queries/useOvertimeRequests"
import type { OvertimeRequestFormData } from "@/lib/schemas/overtimeRequestSchema"
import { formatDateToYMD } from "@/lib/utils/helpers"
import { getOvertimeRequestsColumns } from "./columns"

type BulkOvertimeRow = {
  id: number
  employee: number
  date: string
  time_start: string
  time_end: string
  reason: string
}

const toDateTimeLocal = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  const hours = String(value.getHours()).padStart(2, "0")
  const minutes = String(value.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const buildBulkRow = (id: number, employeeId: number): BulkOvertimeRow => {
  const now = new Date()
  const start = new Date(now)
  start.setHours(18, 0, 0, 0)
  const end = new Date(now)
  end.setHours(20, 0, 0, 0)

  return {
    id,
    employee: employeeId,
    date: formatDateToYMD(now),
    time_start: toDateTimeLocal(start),
    time_end: toDateTimeLocal(end),
    reason: "",
  }
}

export default function OvertimePage() {
  const { isAdmin, user_id } = useCurrentUser()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null)
  const [bulkRows, setBulkRows] = useState<BulkOvertimeRow[]>([])
  const [nextBulkRowId, setNextBulkRowId] = useState(1)

  const { data: overtimeRequests, isLoading } = useOvertimeRequests()
  const { data: employeeChoices = [] } = useEmployeeChoices({
    includeInPayroll: true,
  })
  const createMutation = useCreateOvertimeRequest()
  const updateMutation = useUpdateOvertimeRequest()
  const approveMutation = useApproveOvertimeRequest()
  const deleteMutation = useDeleteOvertimeRequest()

  const editingRequest = useMemo(
    () =>
      (overtimeRequests?.results ?? []).find(
        (request) => request.id === editingRequestId,
      ),
    [editingRequestId, overtimeRequests?.results],
  )

  const handleCreate = async (formData: OvertimeRequestFormData) => {
    const input: CreateOvertimeRequestInput = {
      employee: formData.employee,
      date: formatDateToYMD(formData.date),
      time_start: formData.time_start.toISOString(),
      time_end: formData.time_end.toISOString(),
      reason: formData.reason,
    }

    await createMutation.mutateAsync(input)
    setIsCreateDialogOpen(false)
  }

  const handleApprove = async (id: number) => {
    await approveMutation.mutateAsync({ id, approved: true })
  }

  const handleReject = async (id: number) => {
    await approveMutation.mutateAsync({ id, approved: false })
  }

  const handleDelete = async (id: number) => {
    if (confirm("Cancel this overtime request? This action cannot be undone.")) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleEdit = (id: number) => {
    setEditingRequestId(id)
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async (formData: OvertimeRequestFormData) => {
    if (!editingRequestId) return

    await updateMutation.mutateAsync({
      id: editingRequestId,
      date: formatDateToYMD(formData.date),
      time_start: formData.time_start.toISOString(),
      time_end: formData.time_end.toISOString(),
      reason: formData.reason,
    })

    setIsEditDialogOpen(false)
    setEditingRequestId(null)
  }

  const openBulkDialog = () => {
    const defaultEmployee = employeeChoices[0]?.id ?? user_id
    setBulkRows([buildBulkRow(nextBulkRowId, defaultEmployee)])
    setNextBulkRowId((current) => current + 1)
    setIsBulkDialogOpen(true)
  }

  const addBulkRow = () => {
    const defaultEmployee = employeeChoices[0]?.id ?? user_id
    setBulkRows((current) => [
      ...current,
      buildBulkRow(nextBulkRowId, defaultEmployee),
    ])
    setNextBulkRowId((current) => current + 1)
  }

  const removeBulkRow = (id: number) => {
    setBulkRows((current) => current.filter((row) => row.id !== id))
  }

  const updateBulkRow = (
    id: number,
    field: keyof Omit<BulkOvertimeRow, "id">,
    value: string | number,
  ) => {
    setBulkRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    )
  }

  const handleBulkCreate = async () => {
    if (bulkRows.length === 0) return

    for (const row of bulkRows) {
      if (!row.employee || !row.date || !row.time_start || !row.time_end) {
        toast.error("Each bulk overtime row must include employee, date, start, and end time.")
        return
      }

      const start = new Date(row.time_start)
      const end = new Date(row.time_end)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        toast.error("One or more overtime rows has an invalid date/time value.")
        return
      }

      if (end <= start) {
        toast.error("End time must be later than start time for every row.")
        return
      }
    }

    await Promise.all(
      bulkRows.map((row) =>
        createMutation.mutateAsync({
          employee: row.employee,
          date: row.date,
          time_start: new Date(row.time_start).toISOString(),
          time_end: new Date(row.time_end).toISOString(),
          reason: row.reason.trim(),
        }),
      ),
    )

    toast.success(`${bulkRows.length} overtime request(s) created.`)
    setIsBulkDialogOpen(false)
    setBulkRows([])
  }

  const handleBulkCancel = async (
    selectedRows: Array<{ id: number; approved: boolean }>,
  ) => {
    const cancellableIds = selectedRows
      .filter((row) => !row.approved)
      .map((row) => row.id)

    if (cancellableIds.length === 0) {
      toast.error("Only pending overtime requests can be cancelled.")
      return
    }

    if (!confirm(`Cancel ${cancellableIds.length} selected overtime request(s)?`)) {
      return
    }

    await Promise.all(cancellableIds.map((id) => deleteMutation.mutateAsync(id)))
    toast.success(`${cancellableIds.length} overtime request(s) cancelled.`)
  }

  const columns = getOvertimeRequestsColumns({
    onEdit: handleEdit,
    onApprove: handleApprove,
    onReject: handleReject,
    onCancel: handleDelete,
    isAdmin,
  })

  return (
    <Wrapper>
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          title="Overtime Requests"
          description="Manage employee overtime requests and approvals"
          icon={Clock}
          actionButton={
            isAdmin ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={openBulkDialog}
                >
                  Bulk Add
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Request
                </Button>
              </div>
            ) : undefined
          }
        />

        <DataTable
          columns={columns}
          data={
            overtimeRequests || {
              results: [],
              count: 0,
              next: null,
              previous: null,
            }
          }
          isLoading={isLoading}
          enableRowSelection={isAdmin}
          bulkActions={
            isAdmin
              ? [
                  {
                    label: "Cancel Selected",
                    icon: X,
                    variant: "destructive",
                    onClick: handleBulkCancel,
                  },
                ]
              : undefined
          }
        />

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Overtime Request</DialogTitle>
              <DialogDescription>
                Submit a new overtime request. It will need approval from
                management.
              </DialogDescription>
            </DialogHeader>
            <OvertimeRequestForm
              onSubmit={handleCreate}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) setEditingRequestId(null)
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Overtime Request</DialogTitle>
              <DialogDescription>
                Update overtime details before final approval.
              </DialogDescription>
            </DialogHeader>
            {editingRequest && (
              <OvertimeRequestForm
                overtimeRequest={editingRequest}
                onSubmit={handleUpdate}
                isLoading={updateMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={isBulkDialogOpen}
          onOpenChange={setIsBulkDialogOpen}
        >
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Bulk Add Overtime Requests</DialogTitle>
              <DialogDescription>
                Add multiple overtime entries in one submission. This is available
                to admin only.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {bulkRows.map((row, index) => (
                <div
                  key={row.id}
                  className="rounded-lg border p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">Entry {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={bulkRows.length === 1}
                      onClick={() => removeBulkRow(row.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                    <div className="space-y-1 lg:col-span-2">
                      <Label>Employee</Label>
                      <Select
                        value={String(row.employee)}
                        onValueChange={(value) =>
                          updateBulkRow(row.id, "employee", Number.parseInt(value, 10))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
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
                    </div>

                    <div className="space-y-1">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={row.date}
                        onChange={(event) =>
                          updateBulkRow(row.id, "date", event.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Start</Label>
                      <Input
                        type="datetime-local"
                        value={row.time_start}
                        onChange={(event) =>
                          updateBulkRow(row.id, "time_start", event.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>End</Label>
                      <Input
                        type="datetime-local"
                        value={row.time_end}
                        onChange={(event) =>
                          updateBulkRow(row.id, "time_end", event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <Label>Reason (Optional)</Label>
                    <Textarea
                      rows={2}
                      value={row.reason}
                      onChange={(event) =>
                        updateBulkRow(row.id, "reason", event.target.value)
                      }
                      placeholder="Reason for overtime"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                onClick={addBulkRow}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Another Row
              </Button>

              <Button
                onClick={handleBulkCreate}
                disabled={createMutation.isPending || bulkRows.length === 0}
              >
                {createMutation.isPending ? "Submitting..." : "Submit Bulk Overtime"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Wrapper>
  )
}
