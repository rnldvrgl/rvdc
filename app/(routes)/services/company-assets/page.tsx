"use client"

import { getCompanyAssetColumns } from "@/app/(routes)/services/company-assets/columns"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { DataTable } from "@/components/custom/table/DataTable"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CompanyAsset } from "@/lib/constants/interface"
import { PaginatedResult } from "@/lib/constants/types"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useCompanyAssetMutations } from "@/lib/mutations/services/useCompanyAssetMutations"
import {
  useCompanyAssetFilters,
  useCompanyAssets,
} from "@/lib/queries/services/useCompanyAssets"
import { Building2 } from "lucide-react"
import { useState } from "react"

const emptyData: PaginatedResult<CompanyAsset> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
}

export default function CompanyAssetsPage() {
  const searchParams = useSearchParameters()
  const { page, limit, search, ordering, filter } = searchParams

  const { data, isLoading, refetch } = useCompanyAssets({
    page,
    limit,
    search,
    ordering,
    filter,
  })

  const { filters, orderingOptions } = useCompanyAssetFilters()
  const { dispose, updateStatus } = useCompanyAssetMutations()

  const [disposeTarget, setDisposeTarget] = useState<CompanyAsset | null>(null)
  const [disposeNotes, setDisposeNotes] = useState("")

  const [updateTarget, setUpdateTarget] = useState<CompanyAsset | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [statusNotes, setStatusNotes] = useState("")

  const handleDispose = (asset: CompanyAsset) => {
    setDisposeTarget(asset)
    setDisposeNotes("")
  }

  const handleUpdateStatus = (asset: CompanyAsset) => {
    setUpdateTarget(asset)
    setNewStatus(asset.status)
    setStatusNotes(asset.condition_notes ?? "")
  }

  const confirmDispose = () => {
    if (!disposeTarget) return
    dispose.mutate(
      { id: disposeTarget.id, notes: disposeNotes || undefined },
      {
        onSuccess: () => {
          setDisposeTarget(null)
          setDisposeNotes("")
          refetch()
        },
      },
    )
  }

  const confirmUpdateStatus = () => {
    if (!updateTarget || !newStatus) return
    updateStatus.mutate(
      {
        id: updateTarget.id,
        status: newStatus,
        condition_notes: statusNotes || undefined,
      },
      {
        onSuccess: () => {
          setUpdateTarget(null)
          setNewStatus("")
          setStatusNotes("")
          refetch()
        },
      },
    )
  }

  const columns = getCompanyAssetColumns({
    onDispose: handleDispose,
    onUpdateStatus: handleUpdateStatus,
  })

  return (
    <Wrapper>
      <PageHeader
        icon={Building2}
        title="Company Assets"
        description="Appliances acquired through forfeiture or client sale — tracked separately from inventory"
        onRefresh={refetch}
      />

      <DataTable<CompanyAsset, unknown>
        enableVirtualization
        columns={columns}
        data={data ?? emptyData}
        isLoading={isLoading}
        filters={filters}
        orderingOptions={orderingOptions}
        emptyIcon={Building2}
        emptyTitle="No company assets found"
        emptyDescription="Appliances declared as company property will appear here"
        searchPlaceholder="Search by client, appliance, service ref..."
      />

      {/* Dispose Dialog */}
      <Dialog
        open={!!disposeTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDisposeTarget(null)
            setDisposeNotes("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Asset as Disposed</DialogTitle>
            <DialogDescription>
              {disposeTarget
                ? `Dispose of "${disposeTarget.appliance_description}"? This status is final.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="dispose-notes">Disposal Notes (optional)</Label>
              <Textarea
                id="dispose-notes"
                placeholder="e.g. Scrapped, donated, sold as parts..."
                value={disposeNotes}
                onChange={(e) => setDisposeNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDisposeTarget(null)
                  setDisposeNotes("")
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDispose}
                disabled={dispose.isPending}
              >
                {dispose.isPending ? "Disposing..." : "Mark as Disposed"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog
        open={!!updateTarget}
        onOpenChange={(open) => {
          if (!open) {
            setUpdateTarget(null)
            setNewStatus("")
            setStatusNotes("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Asset Status</DialogTitle>
            <DialogDescription>
              {updateTarget
                ? `Update status for "${updateTarget.appliance_description}"`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="holding">In Storage</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="repurposed">Repurposed</SelectItem>
                  <SelectItem value="disposed">Disposed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status-notes">Condition Notes (optional)</Label>
              <Textarea
                id="status-notes"
                placeholder="Any notes about the asset condition or disposition..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setUpdateTarget(null)
                  setNewStatus("")
                  setStatusNotes("")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmUpdateStatus}
                disabled={updateStatus.isPending || !newStatus}
              >
                {updateStatus.isPending ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Wrapper>
  )
}
