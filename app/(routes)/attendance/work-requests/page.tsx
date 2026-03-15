"use client"

import { Check, Hand, X } from "lucide-react"
import { useState } from "react"

import { ArchiveToggle } from "@/components/custom/shared/ArchiveToggle"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import type { BulkAction } from "@/components/custom/table/DataTable"
import { DataTable } from "@/components/custom/table/DataTable"
import type { WorkRequest } from "@/lib/constants/types"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import {
  useApproveWorkRequest,
  useBatchApproveWorkRequests,
  useBatchDeclineWorkRequests,
  useDeclineWorkRequest,
} from "@/lib/mutations/useWorkRequestMutations"
import { useWorkRequests } from "@/lib/queries/useWorkRequests"
import { getWorkRequestColumns } from "./columns"

type StatusFilter = "pending" | "all"

export default function WorkRequestsPage() {
  const { isAdmin } = useCurrentUser()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending")

  const { data: workRequests, isLoading } = useWorkRequests(
    statusFilter === "pending" ? { status: "pending" } : undefined,
  )
  const approveMutation = useApproveWorkRequest()
  const declineMutation = useDeclineWorkRequest()
  const batchApproveMutation = useBatchApproveWorkRequests()
  const batchDeclineMutation = useBatchDeclineWorkRequests()

  const handleApprove = async (id: number) => {
    await approveMutation.mutateAsync({ id })
  }

  const handleDecline = async (id: number) => {
    await declineMutation.mutateAsync({ id })
  }

  const columns = getWorkRequestColumns({
    onApprove: handleApprove,
    onDecline: handleDecline,
    isAdmin,
  })

  const bulkActions: BulkAction<WorkRequest>[] = isAdmin
    ? [
        {
          label: "Approve",
          icon: Check,
          variant: "default",
          onClick: (rows) => {
            const ids = rows
              .filter((r) => r.status === "pending")
              .map((r) => r.id)
            if (ids.length > 0) {
              batchApproveMutation.mutate({ ids })
            }
          },
        },
        {
          label: "Decline",
          icon: X,
          variant: "destructive",
          onClick: (rows) => {
            const ids = rows
              .filter((r) => r.status === "pending")
              .map((r) => r.id)
            if (ids.length > 0) {
              batchDeclineMutation.mutate({ ids })
            }
          },
        },
      ]
    : []

  return (
    <Wrapper>
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          title="Work Requests"
          description="Manage employee requests to work on shop-closed days"
          icon={Hand}
        />

        <ArchiveToggle
          isArchived={statusFilter === "all"}
          onToggle={(val) => setStatusFilter(val ? "all" : "pending")}
          activeLabel="Pending"
          archivedLabel="All"
        />

        <DataTable
          columns={columns}
          data={
            workRequests || {
              results: [],
              count: 0,
              next: null,
              previous: null,
            }
          }
          isLoading={isLoading}
          enableRowSelection={isAdmin}
          bulkActions={bulkActions}
        />
      </div>
    </Wrapper>
  )
}
