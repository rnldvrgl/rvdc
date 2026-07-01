"use client"

import { getStockRequestColumns } from "@/app/(routes)/inventory/stock-requests/columns"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { BulkAction, DataTable } from "@/components/custom/table/DataTable"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FilterDefinition, StockRequest } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import {
    useApproveStockRequest,
    useBatchApproveStockRequests,
    useDeclineStockRequest,
} from "@/lib/mutations/useStockRequestMutations"
import { useStockRequests } from "@/lib/queries/inventory/useStockRequests"
import { Check, ClipboardList } from "lucide-react"
import { useState } from "react"

const STATUS_FILTER: FilterDefinition = {
    key: "status",
    label: "Status",
    options: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Declined", value: "declined" },
        { label: "Cancelled", value: "cancelled" },
    ],
}

const SOURCE_FILTER: FilterDefinition = {
    key: "source",
    label: "Source",
    options: [
        { label: "Appliance", value: "service_appliance" },
        { label: "Service", value: "service" },
        { label: "Direct", value: "direct" },
    ],
}

export default function StockRequestsPage() {
    const { isAdmin } = useCurrentUser()
    const { page, limit, search, ordering, filter } = useSearchParameters()
    const { data, isLoading } = useStockRequests({
        page,
        limit,
        search,
        ordering,
        filter,
    })

    const approveMutation = useApproveStockRequest()
    const declineMutation = useDeclineStockRequest()
    const batchApproveMutation = useBatchApproveStockRequests()

    const [declineDialog, setDeclineDialog] = useState<{
        open: boolean
        request?: StockRequest
    }>({ open: false })
    const [declineReason, setDeclineReason] = useState("")

    const handleApprove = async (request: StockRequest) => {
        await approveMutation.mutateAsync({ id: request.id })
    }

    const handleDeclineClick = (request: StockRequest) => {
        setDeclineReason("")
        setDeclineDialog({ open: true, request })
    }

    const handleDeclineConfirm = async () => {
        if (!declineDialog.request) return
        await declineMutation.mutateAsync({
            id: declineDialog.request.id,
            reason: declineReason || undefined,
        })
        setDeclineDialog({ open: false })
    }

    const handleBatchApprove = async (selectedRows: StockRequest[]) => {
        const pendingIds = selectedRows
            .filter((r) => r.status === "pending")
            .map((r) => r.id)
        if (pendingIds.length === 0) return
        await batchApproveMutation.mutateAsync(pendingIds)
    }

    const columns = getStockRequestColumns({
        onApprove: handleApprove,
        onDecline: handleDeclineClick,
        isAdmin,
    })

    const bulkActions: BulkAction<StockRequest>[] = isAdmin
        ? [
            {
                label: "Approve Selected",
                icon: Check,
                variant: "default",
                onClick: handleBatchApprove,
            },
        ]
        : []

    return (
        <Wrapper>
            <div className="space-y-4 md:space-y-6">
                <PageHeader
                    isAdminOnly
                    title="Stock Requests"
                    description="Review and manage stock requests from service items with insufficient inventory"
                    icon={ClipboardList}
                />

                <DataTable
                    columns={columns}
                    data={data || { results: [], count: 0, next: null, previous: null }}
                    isLoading={isLoading}
                    filters={[STATUS_FILTER, SOURCE_FILTER]}
                    orderingOptions={[
                        { label: "Newest First", value: "-created_at" },
                        { label: "Oldest First", value: "created_at" },
                    ]}
                    withoutDateRangeFilter
                    enableRowSelection={isAdmin}
                    bulkActions={bulkActions}
                    emptyIcon={ClipboardList}
                    emptyTitle="No stock requests"
                    emptyDescription="Stock requests will appear here when service items are added with insufficient inventory."
                />
            </div>

            {/* Decline Reason Dialog */}
            <Dialog
                open={declineDialog.open}
                onOpenChange={(open) => {
                    if (!open) setDeclineDialog({ open: false })
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Decline Stock Request</DialogTitle>
                        <DialogDescription>
                            Decline the request for{" "}
                            {declineDialog.request?.requested_quantity}{" "}
                            {declineDialog.request?.item_name}? You can optionally provide a
                            reason.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="decline-reason">Reason</Label>
                        <Input
                            id="decline-reason"
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            placeholder="Enter reason for declining..."
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeclineDialog({ open: false })}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeclineConfirm}
                            disabled={declineMutation.isPending}
                        >
                            Decline Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Wrapper>
    )
}
