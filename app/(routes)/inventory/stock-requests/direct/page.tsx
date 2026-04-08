"use client"

import DirectBatchReviewDialog from "@/components/inventory/DirectBatchReviewDialog"
import CreateDirectStockRequestDialog from "@/components/inventory/CreateDirectStockRequestDialog"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { DirectStockRequestBatch } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import useSearchParameters from "@/lib/hooks/useSearchParameters"
import { useCancelDirectStockBatch } from "@/lib/mutations/useStockRequestMutations"
import { useDirectStockBatches } from "@/lib/queries/inventory/useStockRequests"
import { getBadgeVariant } from "@/lib/utils/helpers"
import { format } from "date-fns"
import { ClipboardList, Eye, PackagePlus, X } from "lucide-react"
import { useState } from "react"

export default function DirectStockRequestsPage() {
  const { isAdmin } = useCurrentUser()
  const { page, limit } = useSearchParameters()
  const { data, isLoading } = useDirectStockBatches({ page, limit })
  const cancelMutation = useCancelDirectStockBatch()

  const [createOpen, setCreateOpen] = useState(false)
  const [reviewBatch, setReviewBatch] = useState<DirectStockRequestBatch | null>(null)

  const batches = data?.results ?? []

  return (
    <Wrapper>
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          title="Direct Stock Requests"
          description="Request stock items directly — not tied to a service order"
          icon={PackagePlus}
          actionButton={
            !isAdmin ? (
              <Button onClick={() => setCreateOpen(true)}>
                <PackagePlus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            ) : null
          }
        />

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <ClipboardList className="h-10 w-10 opacity-30" />
            <p className="text-sm">No direct stock requests yet.</p>
            {!isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                <PackagePlus className="h-4 w-4 mr-1" />
                Create your first request
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch) => (
              <BatchCard
                key={batch.id}
                batch={batch}
                isAdmin={!!isAdmin}
                onReview={() => setReviewBatch(batch)}
                onCancel={() => cancelMutation.mutate(batch.id)}
                isCancelling={cancelMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <CreateDirectStockRequestDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {reviewBatch && (
        <DirectBatchReviewDialog
          batch={reviewBatch}
          open={!!reviewBatch}
          onClose={() => setReviewBatch(null)}
        />
      )}
    </Wrapper>
  )
}

function BatchCard({
  batch,
  isAdmin,
  onReview,
  onCancel,
  isCancelling,
}: {
  batch: DirectStockRequestBatch
  isAdmin: boolean
  onReview: () => void
  onCancel: () => void
  isCancelling: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">Batch #{batch.id}</span>
            <Badge variant={getBadgeVariant(batch.status)} className="text-xs">
              {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            By {batch.requested_by_name ?? "Unknown"} &middot;{" "}
            {format(new Date(batch.created_at), "MMM dd, yyyy hh:mm a")}
          </p>
          {batch.notes && (
            <p className="text-xs text-muted-foreground italic">
              &ldquo;{batch.notes}&rdquo;
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Progress summary */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            {batch.approved_count > 0 && (
              <Badge variant="success" className="text-xs">
                {batch.approved_count} approved
              </Badge>
            )}
            {batch.declined_count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {batch.declined_count} skipped
              </Badge>
            )}
            {batch.pending_count > 0 && (
              <Badge variant="outline" className="text-xs">
                {batch.pending_count} pending
              </Badge>
            )}
          </div>

          {/* Actions */}
          {isAdmin && batch.status === "pending" && (
            <Button size="sm" variant="default" onClick={onReview}>
              <Eye className="h-4 w-4 mr-1" />
              Review
            </Button>
          )}
          {!isAdmin && batch.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={onCancel}
              disabled={isCancelling}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1.5">
          {batch.items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${
                item.status === "approved"
                  ? "border-success/40 bg-success/5 text-success line-through opacity-70"
                  : item.status === "declined"
                  ? "border-muted bg-muted/30 text-muted-foreground line-through"
                  : "border-border bg-muted/20"
              }`}
            >
              <span className="font-medium">{item.item_name}</span>
              <span className="text-muted-foreground">
                ×{item.approved_quantity ?? item.requested_quantity} {item.item_unit}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
