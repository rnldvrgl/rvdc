"use client"

import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
import { WarrantyClaim } from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useWarrantyClaimMutations } from "@/lib/mutations/installations/useWarrantyClaimMutations"
import { useWarrantyClaims } from "@/lib/queries/useAircons"
import { formatDate } from "date-fns"
import { CheckCircle2, Eye, XCircle } from "lucide-react"
import { useState } from "react"

export default function ExistingClaimsList() {
  const { canManage } = useCurrentUser()
  const {
    deleteWarrantyClaim,
    approveWarrantyClaim,
    rejectWarrantyClaim,
    cancelWarrantyClaim,
    completeWarrantyClaim,
  } = useWarrantyClaimMutations()

  const { data: claimsData, isLoading } = useWarrantyClaims({
    page: 1,
    limit: 100,
  })

  const [expandedClaim, setExpandedClaim] = useState<number | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean
    claim?: WarrantyClaim
  }>({ open: false })
  const [rejectReason, setRejectReason] = useState("")
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean
    claim?: WarrantyClaim
  }>({ open: false })
  const [approveData, setApproveData] = useState({
    technician_assessment: "",
    create_service: true,
    scheduled_date: "",
    scheduled_time: "",
  })
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean
    type: "delete" | "cancel" | "complete"
    claim?: WarrantyClaim
  }>({ open: false, type: "delete" })

  const statusConfig: Record<
    string,
    { label: string; bg: string; text: string; ring: string }
  > = {
    pending: {
      label: "Pending",
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      ring: "ring-yellow-600/20",
    },
    approved: {
      label: "Approved",
      bg: "bg-blue-50",
      text: "text-blue-700",
      ring: "ring-blue-700/10",
    },
    rejected: {
      label: "Rejected",
      bg: "bg-red-50",
      text: "text-destructive",
      ring: "ring-red-600/20",
    },
    in_progress: {
      label: "In Progress",
      bg: "bg-purple-50",
      text: "text-purple-700",
      ring: "ring-purple-600/20",
    },
    completed: {
      label: "Completed",
      bg: "bg-green-50",
      text: "text-success",
      ring: "ring-green-600/20",
    },
    cancelled: {
      label: "Cancelled",
      bg: "bg-gray-50",
      text: "text-gray-500",
      ring: "ring-gray-500/10",
    },
  }

  const claims = claimsData?.results ?? []

  const handleApproveOpen = (claim: WarrantyClaim) => {
    setApproveData({
      technician_assessment: "",
      create_service: true,
      scheduled_date: "",
      scheduled_time: "",
    })
    setApproveDialog({ open: true, claim })
  }

  const handleApproveSubmit = () => {
    if (!approveDialog.claim) return
    approveWarrantyClaim.mutate(
      {
        id: approveDialog.claim.id,
        data: {
          technician_assessment: approveData.technician_assessment || undefined,
          create_service: approveData.create_service,
          scheduled_date: approveData.scheduled_date || undefined,
          scheduled_time: approveData.scheduled_time || undefined,
        },
      },
      { onSuccess: () => setApproveDialog({ open: false }) },
    )
  }

  const handleRejectOpen = (claim: WarrantyClaim) => {
    setRejectReason("")
    setRejectDialog({ open: true, claim })
  }

  const handleRejectSubmit = () => {
    if (!rejectDialog.claim || !rejectReason.trim()) return
    rejectWarrantyClaim.mutate(
      { id: rejectDialog.claim.id, reason: rejectReason },
      { onSuccess: () => setRejectDialog({ open: false }) },
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading claims...
        </CardContent>
      </Card>
    )
  }

  if (claims.length === 0) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground">
            Existing Claims ({claims.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {claims.map((claim: WarrantyClaim) => {
              const sc = statusConfig[claim.status] ?? statusConfig.pending
              const isExpanded = expandedClaim === claim.id

              return (
                <div
                  key={claim.id}
                  className="rounded-lg border"
                >
                  {/* Claim Summary Row */}
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() =>
                      setExpandedClaim(isExpanded ? null : claim.id)
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium font-mono truncate">
                          {claim.unit_serial_number || `Unit #${claim.unit}`}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${sc.bg} ${sc.text} ${sc.ring}`}
                        >
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {claim.unit_model_name && `${claim.unit_model_name} • `}
                        {claim.client_name && `${claim.client_name} • `}
                        <span className="capitalize">
                          {claim.claim_type?.replace(/_/g, " ")}
                        </span>
                        {claim.claim_date &&
                          ` • ${formatDate(new Date(claim.claim_date), "MMM dd, yyyy")}`}
                      </p>
                    </div>
                    <Eye className="size-4 text-muted-foreground shrink-0" />
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t p-4 space-y-4 bg-muted/20">
                      {/* Issue Description */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Issue Description
                        </p>
                        <p className="text-sm whitespace-pre-wrap">
                          {claim.issue_description}
                        </p>
                      </div>

                      {claim.customer_notes && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Customer Notes
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {claim.customer_notes}
                          </p>
                        </div>
                      )}

                      {claim.technician_assessment && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Technician Assessment
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {claim.technician_assessment}
                          </p>
                        </div>
                      )}

                      {claim.rejection_reason && (
                        <div className="rounded-md border border-red-200 p-3 bg-red-50/30">
                          <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1">
                            Rejection Reason
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {claim.rejection_reason}
                          </p>
                        </div>
                      )}

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {claim.warranty_days_remaining_at_claim !==
                          undefined && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Warranty Left at Claim
                            </p>
                            <p className="text-sm font-medium">
                              {claim.warranty_days_remaining_at_claim} days
                            </p>
                          </div>
                        )}
                        {claim.reviewed_by_name && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Reviewed By
                            </p>
                            <p className="text-sm font-medium">
                              {claim.reviewed_by_name}
                            </p>
                          </div>
                        )}
                        {(claim.estimated_cost || claim.actual_cost) && (
                          <>
                            {claim.estimated_cost && (
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Estimated Cost
                                </p>
                                <p className="text-sm font-bold">
                                  ₱
                                  {parseFloat(
                                    claim.estimated_cost,
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                  })}
                                </p>
                              </div>
                            )}
                            {claim.actual_cost && (
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Actual Cost
                                </p>
                                <p className="text-sm font-bold">
                                  ₱
                                  {parseFloat(claim.actual_cost).toLocaleString(
                                    "en-US",
                                    { minimumFractionDigits: 2 },
                                  )}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      {canManage && (
                        <div className="flex justify-end gap-2 pt-2 border-t">
                          {claim.is_pending && (
                            <>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRejectOpen(claim)
                                }}
                              >
                                <XCircle className="size-3.5 mr-1.5" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleApproveOpen(claim)
                                }}
                              >
                                <CheckCircle2 className="size-3.5 mr-1.5" />
                                Approve
                              </Button>
                            </>
                          )}
                          {(claim.status === "approved" ||
                            claim.status === "in_progress") && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setConfirmAction({
                                    open: true,
                                    type: "cancel",
                                    claim,
                                  })
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setConfirmAction({
                                    open: true,
                                    type: "complete",
                                    claim,
                                  })
                                }}
                              >
                                <CheckCircle2 className="size-3.5 mr-1.5" />
                                Complete
                              </Button>
                            </>
                          )}
                          {claim.is_pending && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setConfirmAction({
                                  open: true,
                                  type: "delete",
                                  claim,
                                })
                              }}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog
        open={approveDialog.open}
        onOpenChange={(open) => !open && setApproveDialog({ open: false })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Warranty Claim</DialogTitle>
            <DialogDescription>
              Approve claim #{approveDialog.claim?.id} for unit{" "}
              {approveDialog.claim?.unit_serial_number}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Technician Assessment (optional)</Label>
              <Textarea
                value={approveData.technician_assessment}
                onChange={(e) =>
                  setApproveData((prev) => ({
                    ...prev,
                    technician_assessment: e.target.value,
                  }))
                }
                placeholder="Enter technician assessment..."
                rows={3}
              />
            </div>
            <div className="flex items-start gap-3 rounded-md border p-3">
              <Checkbox
                checked={approveData.create_service}
                onCheckedChange={(checked) =>
                  setApproveData((prev) => ({
                    ...prev,
                    create_service: !!checked,
                  }))
                }
              />
              <div>
                <Label className="cursor-pointer">
                  Create warranty service automatically
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  A service record will be created for this warranty claim
                </p>
              </div>
            </div>
            {approveData.create_service && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={approveData.scheduled_date}
                    onChange={(e) =>
                      setApproveData((prev) => ({
                        ...prev,
                        scheduled_date: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={approveData.scheduled_time}
                    onChange={(e) =>
                      setApproveData((prev) => ({
                        ...prev,
                        scheduled_time: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialog({ open: false })}
            >
              Cancel
            </Button>
            <Button onClick={handleApproveSubmit}>
              <CheckCircle2 className="size-4 mr-2" />
              Approve Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => !open && setRejectDialog({ open: false })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Warranty Claim</DialogTitle>
            <DialogDescription>
              Reject claim #{rejectDialog.claim?.id}. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>Rejection Reason</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter the reason for rejecting this claim..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim()}
            >
              <XCircle className="size-4 mr-2" />
              Reject Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <ConfirmDialog
        open={confirmAction.open}
        onCancel={() => setConfirmAction({ open: false, type: "delete" })}
        onConfirm={() => {
          if (!confirmAction.claim) return
          if (confirmAction.type === "delete") {
            deleteWarrantyClaim.mutate(confirmAction.claim.id)
          } else if (confirmAction.type === "cancel") {
            cancelWarrantyClaim.mutate({ id: confirmAction.claim.id })
          } else if (confirmAction.type === "complete") {
            completeWarrantyClaim.mutate(confirmAction.claim.id)
          }
          setConfirmAction({ open: false, type: "delete" })
        }}
        title={
          confirmAction.type === "delete"
            ? "Delete Warranty Claim"
            : confirmAction.type === "cancel"
              ? "Cancel Warranty Claim"
              : "Complete Warranty Claim"
        }
        description={
          confirmAction.type === "delete"
            ? `Are you sure you want to delete claim #${confirmAction.claim?.id}? This cannot be undone.`
            : confirmAction.type === "cancel"
              ? `Are you sure you want to cancel claim #${confirmAction.claim?.id}?`
              : `Mark claim #${confirmAction.claim?.id} as completed?`
        }
        confirmText={
          confirmAction.type === "delete"
            ? "Delete"
            : confirmAction.type === "cancel"
              ? "Cancel Claim"
              : "Complete"
        }
        Icon={confirmAction.type === "complete" ? CheckCircle2 : XCircle}
      />
    </>
  )
}
