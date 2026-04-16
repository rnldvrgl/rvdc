"use client"

import PartsManager from "@/components/forms/PartsManager"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  AirconUnits,
  ApplianceStatus,
  ServiceAppliance,
  ServiceAppliancePayload,
} from "@/lib/constants/interface"
import { formatCurrency } from "@/lib/utils/currency"
import { formatDate } from "date-fns"
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Edit,
  Package,
  RotateCcw,
  Trash2,
  User,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { UnitPriceInline } from "./UnitPriceInline"
import { WarrantyCard } from "./WarrantyCard"

// ─── Status flow definitions ─────────────────────────────────────────────────

const INSTALLATION_STATUS_FLOW: {
  from: ApplianceStatus
  to: ApplianceStatus
  label: string
  icon: typeof CheckCircle
  variant: "success" | "outline" | "secondary" | "destructive"
}[] = [
  {
    from: "pending",
    to: "completed",
    label: "Mark Completed",
    icon: CheckCircle,
    variant: "success",
  },
  {
    from: "pending",
    to: "cancelled",
    label: "Cancel",
    icon: RotateCcw,
    variant: "destructive",
  },
  {
    from: "completed",
    to: "pending",
    label: "Reopen",
    icon: RotateCcw,
    variant: "secondary",
  },
  {
    from: "cancelled",
    to: "pending",
    label: "Reopen",
    icon: RotateCcw,
    variant: "secondary",
  },
]

const REPAIR_STATUS_FLOW: {
  from: ApplianceStatus
  to: ApplianceStatus
  label: string
  icon: typeof ArrowRight
  variant: "success" | "outline" | "secondary" | "destructive"
}[] = [
  {
    from: "pending",
    to: "completed",
    label: "Mark Completed",
    icon: CheckCircle,
    variant: "success",
  },
  {
    from: "pending",
    to: "cancelled",
    label: "Cancel",
    icon: RotateCcw,
    variant: "destructive",
  },
  {
    from: "completed",
    to: "pending",
    label: "Reopen",
    icon: RotateCcw,
    variant: "secondary",
  },
  {
    from: "cancelled",
    to: "pending",
    label: "Reopen",
    icon: RotateCcw,
    variant: "secondary",
  },
]

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ApplianceCardProps {
  appliance: ServiceAppliance
  serviceId: number
  isInstallation: boolean
  isComplementary?: boolean
  installationUnits: AirconUnits[]
  serviceTechnicians: number[]
  users: { id: number; full_name: string }[]
  disabled: boolean
  canManageParts: boolean
  expanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onUpdate?: () => void | Promise<void>
  getStatusLabel: (s: ApplianceStatus) => string
  updateAppliance: {
    mutateAsync: (args: {
      id: number
      data: ServiceAppliancePayload
    }) => Promise<unknown>
  }
  toggleItemsChecked: {
    mutateAsync: (args: { id: number; serviceId?: number }) => Promise<unknown>
    isPending: boolean
  }
  canConfirmItems: boolean
  invalidateServiceQueries: () => Promise<void>
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ApplianceCard({
  appliance,
  serviceId,
  isInstallation,
  isComplementary,
  installationUnits,
  serviceTechnicians,
  users,
  disabled,
  canManageParts,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onUpdate,
  getStatusLabel,
  updateAppliance,
  toggleItemsChecked,
  canConfirmItems,
  invalidateServiceQueries,
}: ApplianceCardProps) {
  const [statusLoading, setStatusLoading] = useState(false)

  const statusActions = isInstallation
    ? INSTALLATION_STATUS_FLOW
    : REPAIR_STATUS_FLOW
  const availableActions = statusActions.filter(
    (a) => a.from === appliance.status,
  )

  const handleStatusChange = async (newStatus: ApplianceStatus) => {
    setStatusLoading(true)
    try {
      await updateAppliance.mutateAsync({
        id: appliance.id,
        data: {
          service: serviceId,
          appliance_type_id: appliance.appliance_type?.id ?? null,
          labor_fee: parseFloat(appliance.labor_fee),
          status: newStatus,
        },
      })
      toast.success(`Status changed to ${getStatusLabel(newStatus)}`)
      await invalidateServiceQueries()
    } catch {
      // handled by useApiMutation
    } finally {
      setStatusLoading(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold">
              {appliance.appliance_type?.name ||
                appliance.aircon_model_name ||
                (appliance.brand && appliance.model
                  ? `${appliance.brand} ${appliance.model}`
                  : "Unknown Appliance")}
            </h4>
            <Badge
              variant="outline"
              className="text-xs font-medium"
            >
              {getStatusLabel(appliance.status)}
            </Badge>
            {appliance.unit_type === "pre_order" && (
              <Badge
                variant="outline"
                className="text-xs font-medium border-amber-500 text-amber-600 dark:text-amber-400"
              >
                Pre-Order
              </Badge>
            )}
          </div>

          {(appliance.brand || appliance.model) && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Package className="h-3 w-3" />
              <span className="font-medium">{appliance.brand || "—"}</span>
              {appliance.model && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span>{appliance.model}</span>
                </>
              )}
            </p>
          )}

          {serviceTechnicians.length > 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <User className="h-3 w-3" />
              <span>
                {serviceTechnicians
                  .map(
                    (techId) => users.find((u) => u.id === techId)?.full_name,
                  )
                  .filter(Boolean)
                  .join(", ") || "—"}
              </span>
            </p>
          )}
        </div>

        <div className="flex gap-0.5 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="h-7 w-7 p-0"
              >
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {expanded
                  ? "Hide parts used"
                  : canManageParts && !disabled
                    ? "Show and manage parts used"
                    : "Show parts used"}
              </p>
            </TooltipContent>
          </Tooltip>
          {!disabled && !isComplementary && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="h-7 w-7 p-0"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit {isInstallation ? "unit" : "appliance"} details</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="h-7 w-7 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete appliance and all its parts</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>

      {/* Status Actions */}
      {!disabled && availableActions.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap px-4 pb-3">
          {availableActions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={`${action.from}-${action.to}`}
                type="button"
                variant={action.variant}
                size="sm"
                disabled={statusLoading}
                onClick={() => handleStatusChange(action.to)}
                className="h-6 text-xs px-2"
              >
                <Icon className="mr-1 h-3 w-3" />
                {action.label}
              </Button>
            )
          })}
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-4 space-y-3">
        {appliance.issue_reported && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Issue Reported
            </p>
            <p className="text-sm leading-relaxed bg-muted/40 p-2.5 rounded-md">
              {appliance.issue_reported}
            </p>
          </div>
        )}

        {appliance.diagnosis_notes && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Diagnosis
            </p>
            <p className="text-sm leading-relaxed bg-blue-50 dark:bg-blue-950/20 p-2.5 rounded-md border border-blue-200/50 dark:border-blue-900/50">
              {appliance.diagnosis_notes}
            </p>
          </div>
        )}

        {/* Parts Needed Notes (from manager/technician) */}
        {appliance.parts_needed_notes && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <Package className="h-3 w-3" />
              Parts Needed
            </p>
            <p className="text-sm leading-relaxed bg-orange-50 dark:bg-orange-950/20 p-2.5 rounded-md border border-orange-200/50 dark:border-orange-900/50">
              {appliance.parts_needed_notes}
            </p>
          </div>
        )}

        {/* Items Confirmed Toggle — only when parts_needed_notes exists */}
        {appliance.parts_needed_notes && (
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="flex items-center gap-2 min-w-0">
              {appliance.items_checked ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CheckCircle className="h-4 w-4 text-success shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Parts have been reviewed and confirmed by clerk
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Package className="h-4 w-4 text-orange-500 shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Clerk needs to review and confirm parts
                  </TooltipContent>
                </Tooltip>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {appliance.items_checked
                    ? "Items Confirmed"
                    : "Items Not Yet Confirmed"}
                </p>
                {appliance.items_checked && appliance.items_checked_by && (
                  <p className="text-xs text-muted-foreground">
                    by {appliance.items_checked_by_name || "Unknown"}{" "}
                    {appliance.items_checked_at &&
                      `· ${formatDate(new Date(appliance.items_checked_at), "MMM d, yyyy h:mm a")}`}
                  </p>
                )}
              </div>
            </div>
            {canConfirmItems && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={appliance.items_checked ? "outline" : "default"}
                    size="sm"
                    disabled={
                      toggleItemsChecked.isPending ||
                      (!appliance.items_checked &&
                        (!appliance.items_used ||
                          appliance.items_used.length === 0))
                    }
                    onClick={async () => {
                      try {
                        await toggleItemsChecked.mutateAsync({
                          id: appliance.id,
                          serviceId,
                        })
                        toast.success(
                          appliance.items_checked
                            ? "Items marked as not confirmed"
                            : "Items confirmed successfully",
                        )
                        await invalidateServiceQueries()
                      } catch {
                        // handled by useApiMutation
                      }
                    }}
                    className="h-7 text-xs shrink-0"
                  >
                    {appliance.items_checked ? (
                      <>
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Unconfirm
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Confirm Items
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {appliance.items_checked
                    ? "Mark items as needing re-review"
                    : !appliance.items_used || appliance.items_used.length === 0
                      ? "Add parts first before confirming"
                      : "Confirm that all listed parts are correct and complete"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Financial Summary — compact inline */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-muted/30 p-3 text-sm">
          {/* Labor Fee */}
          <div>
            <p className="text-xs text-muted-foreground">Labor</p>
            {appliance.labor_is_free ? (
              <Badge
                variant="success"
                className="text-xs mt-0.5"
              >
                FREE
              </Badge>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-primary">
                  {formatCurrency(
                    parseFloat(
                      appliance.discounted_labor_fee || appliance.labor_fee,
                    ),
                  )}
                </span>
                {appliance.labor_discount_amount &&
                  parseFloat(appliance.labor_discount_amount) > 0 && (
                    <span className="text-xs text-success">
                      ₱{appliance.labor_discount_amount} off
                    </span>
                  )}
              </div>
            )}
          </div>

          {/* Unit Price (installation only) */}
          {isInstallation && (
            <>
              <Separator
                orientation="vertical"
                className="h-8"
              />
              <UnitPriceInline
                appliance={appliance}
                serviceId={serviceId}
                installationUnits={installationUnits}
                disabled={disabled}
                updateAppliance={updateAppliance}
                invalidateServiceQueries={invalidateServiceQueries}
              />
            </>
          )}

          {/* Parts Cost */}
          <Separator
            orientation="vertical"
            className="h-8"
          />
          <div>
            <p className="text-xs text-muted-foreground">Parts</p>
            {appliance.items_used && appliance.items_used.length > 0 ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-primary">
                  {formatCurrency(
                    parseFloat(appliance.total_parts_cost || "0"),
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({appliance.items_used.length}{" "}
                  {appliance.items_used.length === 1 ? "item" : "items"})
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">No parts</span>
            )}
          </div>
        </div>

        {/* Warranty */}
        {!isInstallation &&
          (appliance.labor_warranty_months ||
            appliance.unit_warranty_months ||
            appliance.warranty_notes) && <WarrantyCard appliance={appliance} />}

        {/* Parts Summary (collapsed) */}
        {!expanded &&
          appliance.items_used &&
          appliance.items_used.length > 0 && (
            <PartsSummary parts={appliance.items_used} />
          )}
      </div>

      {/* Expandable Parts Manager */}
      {expanded && (
        <div className="border-t bg-muted/10">
          <div className="p-4">
            <PartsManager
              entityType="appliance"
              entityId={appliance.id}
              disabled={!canManageParts}
              disabledReason={
                !canManageParts
                  ? "Parts are locked for this appliance because the service is completed. Reopen the service first to revise parts, then complete it again."
                  : undefined
              }
              onUpdate={onUpdate}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Parts Summary (collapsed view) ─────────────────────────────────────────

function PartsSummary({
  parts = [],
}: {
  parts?: ServiceAppliance["items_used"]
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Parts Used
      </p>
      <div className="rounded-md bg-muted/20 divide-y">
        {parts.map((part) => {
          const hasDiscount =
            (part.discount_amount && parseFloat(part.discount_amount) > 0) ||
            (part.discount_percentage &&
              parseFloat(part.discount_percentage) > 0)

          return (
            <div
              key={part.id}
              className="flex justify-between items-center text-xs px-3 py-1.5 gap-2"
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-muted-foreground truncate">
                  {part.item_name}
                </span>
                <span className="text-muted-foreground/60 shrink-0">
                  x{part.quantity}
                </span>
                {hasDiscount && (
                  <span className="text-success shrink-0">
                    {part.discount_percentage &&
                    parseFloat(part.discount_percentage) > 0
                      ? `${part.discount_percentage}% off`
                      : `₱${part.discount_amount} off`}
                  </span>
                )}
              </div>
              <span className="font-medium shrink-0">
                {formatCurrency(part.line_total)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
