"use client"

import { Clock, Plus, X } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import DatePicker from "@/components/custom/inputs/DatePicker"
import { EmployeeCardSelect } from "@/components/custom/inputs/EmployeeCardSelect"
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
import { Label } from "@/components/ui/label"
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
import { cn, formatDateToYMD } from "@/lib/utils/helpers"
import { getOvertimeRequestsColumns } from "./columns"

const buildBulkTime = (hour: number, minute: number) => {
  const value = new Date()
  value.setHours(hour, minute, 0, 0)
  return value
}

const combineDateAndTime = (date: Date, time: Date) => {
  const merged = new Date(date)
  merged.setHours(time.getHours(), time.getMinutes(), 0, 0)
  return merged
}

export default function OvertimePage() {
  const { isAdmin, user_id } = useCurrentUser()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null)
  const [bulkEmployeeIds, setBulkEmployeeIds] = useState<number[]>([])
  const [bulkDate, setBulkDate] = useState<Date | undefined>(new Date())
  const [bulkStartTime, setBulkStartTime] = useState<Date | undefined>(
    buildBulkTime(18, 0),
  )
  const [bulkEndTime, setBulkEndTime] = useState<Date | undefined>(
    buildBulkTime(20, 0),
  )
  const [bulkReason, setBulkReason] = useState("")

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
    const defaultEmployee = employeeChoices[0]?.id ?? user_id ?? 0
    setBulkEmployeeIds(defaultEmployee ? [defaultEmployee] : [])
    setBulkDate(new Date())
    setBulkStartTime(buildBulkTime(18, 0))
    setBulkEndTime(buildBulkTime(20, 0))
    setBulkReason("")
    setIsBulkDialogOpen(true)
  }

  const handleBulkCreate = async () => {
    if (bulkEmployeeIds.length === 0) {
      toast.error("Select at least one employee for bulk overtime.")
      return
    }

    if (!bulkDate || !bulkStartTime || !bulkEndTime) {
      toast.error("Date, start time, and end time are required.")
      return
    }

    const start = combineDateAndTime(bulkDate, bulkStartTime)
    const end = combineDateAndTime(bulkDate, bulkEndTime)

    if (end <= start) {
      toast.error("End time must be later than start time.")
      return
    }

    await Promise.all(
      bulkEmployeeIds.map((employeeId) =>
        createMutation.mutateAsync({
          employee: employeeId,
          date: formatDateToYMD(bulkDate),
          time_start: start.toISOString(),
          time_end: end.toISOString(),
          reason: bulkReason.trim(),
        }),
      ),
    )

    toast.success(`${bulkEmployeeIds.length} overtime request(s) created.`)
    setIsBulkDialogOpen(false)
    setBulkEmployeeIds([])
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
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
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
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
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
          <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bulk Add Overtime</DialogTitle>
              <DialogDescription>
                Pick one schedule, then select employees. All selected employees
                will receive the same overtime date, start/end time, and reason.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="rounded-xl border border-border/60 bg-card p-4 md:p-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <DatePicker
                    label="Overtime Date"
                    required
                    field={{
                      value: bulkDate,
                      onChange: setBulkDate,
                    }}
                    mode="date"
                    withMessage
                    captionLayout="dropdown-months"
                  />

                  <DatePicker
                    label="Start Time"
                    required
                    field={{
                      value: bulkStartTime,
                      onChange: setBulkStartTime,
                    }}
                    mode="time"
                    withMessage
                    minuteStep={5}
                    placeholder="Set start"
                  />

                  <DatePicker
                    label="End Time"
                    required
                    field={{
                      value: bulkEndTime,
                      onChange: setBulkEndTime,
                    }}
                    mode="time"
                    withMessage
                    minuteStep={5}
                    placeholder="Set end"
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <Label>Reason (Optional)</Label>
                  <Textarea
                    rows={3}
                    value={bulkReason}
                    onChange={(event) => setBulkReason(event.target.value)}
                    placeholder="Explain why this bulk overtime is needed"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 md:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Select Employees</p>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      bulkEmployeeIds.length > 0
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {bulkEmployeeIds.length} selected
                  </span>
                </div>

                <div className="max-h-[36vh] overflow-y-auto pr-1">
                  <EmployeeCardSelect
                    employees={employeeChoices}
                    selected={bulkEmployeeIds}
                    onChange={setBulkEmployeeIds}
                    disabled={createMutation.isPending}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBulkDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkCreate}
                  disabled={createMutation.isPending || bulkEmployeeIds.length === 0}
                >
                  {createMutation.isPending
                    ? "Submitting..."
                    : "Create Bulk Overtime"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Wrapper>
  )
}
