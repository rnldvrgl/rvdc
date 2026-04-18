"use client"

import { Clock, Plus } from "lucide-react"
import { useState } from "react"

import { getOvertimeRequestsColumns } from "@/app/(routes)/attendance/overtime/columns"
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
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import {
  CreateOvertimeRequestInput,
  useCreateOvertimeRequest,
  useDeleteOvertimeRequest,
} from "@/lib/mutations/useOvertimeMutations"
import { useOvertimeRequests } from "@/lib/queries/useOvertimeRequests"
import { OvertimeRequestFormData } from "@/lib/schemas/overtimeRequestSchema"
import { formatDateToYMD } from "@/lib/utils/helpers"

export default function MyOvertimePage() {
  const { user_id } = useCurrentUser()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const { data: overtimeRequests, isLoading } = useOvertimeRequests({
    employee: user_id,
  })
  const createMutation = useCreateOvertimeRequest()
  const deleteMutation = useDeleteOvertimeRequest()

  const handleCreate = async (formData: OvertimeRequestFormData) => {
    if (!user_id) return

    const input: CreateOvertimeRequestInput = {
      employee: user_id,
      date: formatDateToYMD(formData.date),
      time_start: formData.time_start.toISOString(),
      time_end: formData.time_end.toISOString(),
      reason: formData.reason,
    }

    await createMutation.mutateAsync(input)
    setIsCreateDialogOpen(false)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this overtime request?")) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const columns = getOvertimeRequestsColumns({
    onCancel: handleDelete,
    isAdmin: false,
  })

  return (
    <Wrapper>
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          title="My Overtime"
          description="View and manage your overtime requests"
          icon={Clock}
          actionButton={
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
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
