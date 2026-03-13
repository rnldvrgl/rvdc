"use client"

import { Clock } from "lucide-react"
import { useState } from "react"

import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { OvertimeRequestForm } from "@/components/forms/OvertimeRequestForm"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import {
  useApproveOvertimeRequest,
  useCreateOvertimeRequest,
  useDeleteOvertimeRequest,
  type CreateOvertimeRequestInput,
} from "@/lib/mutations/useOvertimeMutations"
import { useOvertimeRequests } from "@/lib/queries/useOvertimeRequests"
import type { OvertimeRequestFormData } from "@/lib/schemas/overtimeRequestSchema"
import { formatDateToYMD } from "@/lib/utils/helpers"
import { getOvertimeRequestsColumns } from "./columns"

export default function OvertimePage() {
  const { isAdmin } = useCurrentUser()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const { data: overtimeRequests, isLoading } = useOvertimeRequests()
  const createMutation = useCreateOvertimeRequest()
  const approveMutation = useApproveOvertimeRequest()
  const deleteMutation = useDeleteOvertimeRequest()

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
    if (confirm("Are you sure you want to delete this overtime request?")) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const columns = getOvertimeRequestsColumns({
    onApprove: handleApprove,
    onReject: handleReject,
    onDelete: handleDelete,
    isAdmin,
  })

  return (
    <Wrapper>
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          title="Overtime Requests"
          description="Manage employee overtime requests and approvals"
          icon={Clock}
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
      </div>
    </Wrapper>
  )
}
