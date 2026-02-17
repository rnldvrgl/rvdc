"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { DateTimePicker } from "@/components/custom/inputs/DateTimePicker"
import PageHeader from "@/components/custom/shared/PageHeader"
import { Wrapper } from "@/components/custom/shared/Wrapper"
import { Badge } from "@/components/ui/badge"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  AirconUnits,
  ClaimType,
  WarrantyClaim,
} from "@/lib/constants/interface"
import { Client } from "@/lib/constants/types"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useWarrantyClaimMutations } from "@/lib/mutations/installations/useWarrantyClaimMutations"
import { useAirconUnits, useWarrantyClaims } from "@/lib/queries/useAircons"
import { useClientChoices } from "@/lib/queries/useChoices"
import { formatDate } from "date-fns"
import {
  CheckCircle2,
  Eye,
  Info,
  ShieldCheck,
  SprayCan,
  XCircle,
} from "lucide-react"
import { useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"

// ─── Warranty Claims Tab ────────────────────────────────────────────
function WarrantyClaimsTab() {
  const { canManage } = useCurrentUser()
  const { addWarrantyClaim } = useWarrantyClaimMutations()
  const { data: clientsData } = useClientChoices()
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null)

  // Fetch units for selected client
  const { data: unitsData, isLoading: unitsLoading } = useAirconUnits({
    limit: 200,
    filter: selectedClientId ? { client: selectedClientId } : undefined,
    enabled: !!selectedClientId,
  })

  // Eligible units: sold or installed, under warranty
  const eligibleUnits =
    unitsData?.results?.filter(
      (u: AirconUnits) =>
        (u.is_sold || u.unit_status === "Installed") &&
        u.warranty_status === "Under Warranty",
    ) ?? []

  const clientOptions =
    clientsData?.map((c: Client) => ({
      value: c.id,
      label: c.full_name,
    })) ?? []

  const claimTypeOptions = [
    { value: "repair" as const, label: "Repair" },
    { value: "replacement" as const, label: "Replacement" },
    { value: "parts" as const, label: "Parts Replacement" },
    { value: "inspection" as const, label: "Inspection" },
  ]

  const form = useForm<{
    unit_id: number | null
    claim_type: ClaimType
    issue_description: string
    customer_notes: string
  }>({
    defaultValues: {
      unit_id: null,
      claim_type: "repair",
      issue_description: "",
      customer_notes: "",
    },
  })

  const handleClientChange = (clientId: number | string | null) => {
    setSelectedClientId(clientId ? Number(clientId) : null)
    setSelectedUnitId(null)
    form.setValue("unit_id", null)
  }

  const handleUnitSelect = (unitId: number) => {
    setSelectedUnitId(unitId)
    form.setValue("unit_id", unitId)
  }

  const handleSubmit: SubmitHandler<{
    unit_id: number | null
    claim_type: ClaimType
    issue_description: string
    customer_notes: string
  }> = (data) => {
    const unitId = selectedUnitId ?? data.unit_id
    if (!unitId) return

    addWarrantyClaim.mutate(
      {
        unit_id: unitId,
        claim_type: data.claim_type,
        issue_description: data.issue_description,
        customer_notes: data.customer_notes,
      },
      {
        onSuccess: () => {
          // Reset all form state
          form.reset()
          setSelectedUnitId(null)
          setSelectedClientId(null)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      {/* New Claim Form - Inline */}
      {canManage && (
        <>
          {/* Step 1: Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5" />
                New Warranty Claim
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Select a client, choose a unit under warranty, and describe the
                issue.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Client</Label>
                <ComboBox
                  value={selectedClientId}
                  onChange={handleClientChange}
                  options={clientOptions}
                  placeholder="Select a client..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Unit Selection */}
          {selectedClientId && (
            <Card>
              <CardHeader>
                <CardTitle>Select Unit ({eligibleUnits.length})</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Units under warranty eligible for a claim
                </p>
              </CardHeader>
              <CardContent>
                {unitsLoading ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Loading units...
                  </p>
                ) : eligibleUnits.length === 0 ? (
                  <div className="text-center py-8">
                    <Info className="size-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No eligible units found for this client.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {eligibleUnits.map((unit: AirconUnits) => (
                      <div
                        key={unit.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          selectedUnitId === unit.id
                            ? "border-primary"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => handleUnitSelect(unit.id)}
                      >
                        <div
                          className={`size-4 rounded-full border-2 flex items-center justify-center ${
                            selectedUnitId === unit.id
                              ? "border-primary"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedUnitId === unit.id && (
                            <div className="size-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium font-mono truncate">
                            {unit.serial_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {unit.model?.brand?.name} {unit.model?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            Under Warranty
                          </span>
                          {unit.warranty_days_left !== undefined &&
                            unit.warranty_days_left > 0 && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {unit.warranty_days_left}d left
                              </p>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Claim Details */}
          {selectedUnitId && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Claim Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="claim_type"
                      rules={{ required: "Please select a claim type" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Claim Type</FormLabel>
                          <FormControl>
                            <ComboBox
                              value={field.value}
                              onChange={(val) =>
                                field.onChange((val as ClaimType) ?? "repair")
                              }
                              options={claimTypeOptions}
                              placeholder="Select claim type..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="issue_description"
                      rules={{ required: "Issue description is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Issue Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe the issue or defect..."
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Additional notes from the customer (optional)"
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={!selectedUnitId}
                  >
                    <ShieldCheck className="size-4 mr-2" />
                    Submit Claim
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </>
      )}

      {/* Existing Claims List */}
      <ExistingClaimsList />
    </div>
  )
}

// ─── Existing Claims List ─────────────────────────────────────────
function ExistingClaimsList() {
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
      text: "text-red-700",
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
      text: "text-green-700",
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
                          <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">
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
                                  cancelWarrantyClaim.mutate({ id: claim.id })
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  completeWarrantyClaim.mutate(claim.id)
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
                                deleteWarrantyClaim.mutate(claim.id)
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
    </>
  )
}

// ─── Free Cleaning Tab ───────────────────────────────────────────────
function FreeCleaningTab() {
  const { data: clientsData } = useClientChoices()
  const { redeemFreeCleaningBatch } = useWarrantyClaimMutations()
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [selectedUnits, setSelectedUnits] = useState<number[]>([])
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | undefined>(
    undefined,
  )
  const [isRedeeming, setIsRedeeming] = useState(false)

  // Fetch units filtered by client (sale or reservation) when a client is selected
  const { data: unitsData, isLoading: unitsLoading } = useAirconUnits({
    limit: 200,
    filter: selectedClientId ? { client: selectedClientId } : undefined,
    enabled: !!selectedClientId,
  })

  // Filter eligible units for the selected client
  const eligibleUnits =
    unitsData?.results?.filter(
      (u: AirconUnits) =>
        u.free_cleaning_redeemed === false && u.unit_status === "Installed",
    ) ?? []

  // Redeemed units - only for selected client (from same query)
  const redeemedUnits =
    unitsData?.results?.filter(
      (u: AirconUnits) => u.free_cleaning_redeemed === true,
    ) ?? []

  const clientOptions =
    clientsData?.map((c: Client) => ({
      value: c.id,
      label: c.full_name,
    })) ?? []

  const toggleUnit = (unitId: number) => {
    setSelectedUnits((prev) =>
      prev.includes(unitId)
        ? prev.filter((id) => id !== unitId)
        : [...prev, unitId],
    )
  }

  const toggleAll = () => {
    if (selectedUnits.length === eligibleUnits.length) {
      setSelectedUnits([])
    } else {
      setSelectedUnits(eligibleUnits.map((u: AirconUnits) => u.id))
    }
  }

  const handleRedeem = async () => {
    if (selectedUnits.length === 0 || !selectedClientId) return
    setIsRedeeming(true)

    try {
      // Format date/time from the DateTimePicker value
      let scheduled_date: string | undefined
      let scheduled_time: string | undefined

      if (scheduledDateTime) {
        scheduled_date = formatDate(scheduledDateTime, "yyyy-MM-dd")
        scheduled_time = formatDate(scheduledDateTime, "HH:mm:ss")
      }

      await redeemFreeCleaningBatch.mutateAsync({
        client_id: selectedClientId,
        unit_ids: selectedUnits,
        scheduled_date,
        scheduled_time,
      })

      // Reset form
      setSelectedUnits([])
      setScheduledDateTime(undefined)
      setSelectedClientId(null)
    } finally {
      setIsRedeeming(false)
    }
  }

  const handleClientChange = (clientId: number | string | null) => {
    setSelectedClientId(clientId ? Number(clientId) : null)
    setSelectedUnits([]) // Reset unit selection when client changes
  }

  return (
    <div className="space-y-6">
      {/* Client Selection & Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SprayCan className="size-5" />
            Redeem Free Cleaning
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a client, choose their eligible units, and set a schedule for
            the cleaning service.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Client</Label>
            <ComboBox
              value={selectedClientId}
              onChange={handleClientChange}
              options={clientOptions}
              placeholder="Select a client..."
            />
          </div>
          <div>
            <Label>
              Schedule Date & Time <span className="text-destructive">*</span>
            </Label>
            <DateTimePicker
              value={scheduledDateTime}
              onChange={setScheduledDateTime}
              placeholder="Pick schedule date and time..."
              disablePastDates
            />
          </div>
        </CardContent>
      </Card>

      {/* Eligible Units */}
      {selectedClientId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Eligible Units ({eligibleUnits.length})</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Units under warranty with unredeemed free cleaning
                </p>
              </div>
              <div className="flex items-center gap-3">
                {eligibleUnits.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAll}
                  >
                    {selectedUnits.length === eligibleUnits.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                )}
                <Button
                  onClick={handleRedeem}
                  disabled={
                    selectedUnits.length === 0 ||
                    isRedeeming ||
                    !scheduledDateTime
                  }
                  size="sm"
                >
                  <SprayCan className="size-4 mr-2" />
                  Redeem ({selectedUnits.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {unitsLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Loading units...
              </p>
            ) : eligibleUnits.length === 0 ? (
              <div className="text-center py-8">
                <Info className="size-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No eligible units found for this client.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {eligibleUnits.map((unit: AirconUnits) => (
                  <div
                    key={unit.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      selectedUnits.includes(unit.id)
                        ? "border-primary"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleUnit(unit.id)}
                  >
                    <Checkbox
                      checked={selectedUnits.includes(unit.id)}
                      onCheckedChange={() => toggleUnit(unit.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium font-mono truncate">
                        {unit.serial_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {unit.model?.brand?.name} {unit.model?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="success">Eligible</Badge>
                      {unit.warranty_days_left !== undefined &&
                        unit.warranty_days_left > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {unit.warranty_days_left}d warranty left
                          </p>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Redeemed Units - only show when client is selected */}
      {selectedClientId && redeemedUnits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">
              Already Redeemed ({redeemedUnits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {redeemedUnits.map((unit: AirconUnits) => (
                <div
                  key={unit.id}
                  className="flex items-center gap-3 rounded-lg border p-3 opacity-60"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-mono truncate">
                      {unit.serial_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {unit.model?.brand?.name} {unit.model?.name}
                      {unit.client_name && (
                        <span className="ml-2">• {unit.client_name}</span>
                      )}
                    </p>
                  </div>
                  <Badge variant="secondary">Redeemed</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function WarrantyClaimsPage() {
  const { refetch } = useWarrantyClaims({
    page: 1,
    limit: 100,
  })

  return (
    <Wrapper>
      <PageHeader
        icon={ShieldCheck}
        title="Warranty & Free Cleaning"
        description="Manage warranty claims for aircon units and redeem free cleaning services for eligible units."
        breadcrumbs={["Dashboard", "Aircons", "Warranty & Free Cleaning"]}
        onRefresh={refetch}
      />

      <Tabs
        defaultValue="claims"
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="claims">
            <ShieldCheck className="size-4 mr-2" />
            Warranty Claims
          </TabsTrigger>
          <TabsTrigger value="cleaning">
            <SprayCan className="size-4 mr-2" />
            Free Cleaning
          </TabsTrigger>
        </TabsList>

        <TabsContent value="claims">
          <WarrantyClaimsTab />
        </TabsContent>

        <TabsContent value="cleaning">
          <FreeCleaningTab />
        </TabsContent>
      </Tabs>
    </Wrapper>
  )
}
