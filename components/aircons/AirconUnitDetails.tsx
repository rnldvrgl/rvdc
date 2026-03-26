"use client"

import { Button } from "@/components/ui/button"
import { AirconUnits, WarrantyClaim } from "@/lib/constants/interface"
import { useWarrantyClaims } from "@/lib/queries/useAircons"
import { cn } from "@/lib/utils/helpers"
import { formatDate } from "date-fns"
import { Check, Eye, ShieldCheck } from "lucide-react"

interface AirconUnitDetailsProps {
  unit: AirconUnits
  onClose: () => void
  onEdit?: (unit: AirconUnits) => void
  showEditButton?: boolean
}

export function AirconUnitDetails({
  unit,
  onClose,
  onEdit,
  showEditButton = false,
}: AirconUnitDetailsProps) {
  // Fetch warranty claims for this unit
  const { data: claimsData } = useWarrantyClaims({
    limit: 50,
    filter: { unit: unit.id },
  })
  const warrantyClaims: WarrantyClaim[] = claimsData?.results ?? []

  const claimStatusConfig: Record<
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

  return (
    <div className="space-y-6 p-6">
      {/* Quick Summary */}
      <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-lg text-gray-900">
              {unit.model?.brand?.name} {unit.model?.name}
            </h4>
            <p className="text-sm text-gray-600 font-mono mt-1">
              SN: {unit.serial_number}
            </p>
          </div>
          <div>
            {(() => {
              const status = unit.unit_status ?? "Available"
              const variants: Record<
                string,
                { bg: string; text: string; ring: string }
              > = {
                Installed: {
                  bg: "bg-emerald-50",
                  text: "text-success",
                  ring: "ring-emerald-600/20",
                },
                "For Installation": {
                  bg: "bg-blue-50",
                  text: "text-blue-700",
                  ring: "ring-blue-700/10",
                },
                Sold: {
                  bg: "bg-green-50",
                  text: "text-success",
                  ring: "ring-green-600/20",
                },
                Reserved: {
                  bg: "bg-yellow-50",
                  text: "text-yellow-800",
                  ring: "ring-yellow-600/20",
                },
                Available: {
                  bg: "bg-gray-50",
                  text: "text-gray-600",
                  ring: "ring-gray-500/10",
                },
              }
              const v = variants[status] ?? variants.Available
              return (
                <span
                  className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${v.bg} ${v.text} ${v.ring}`}
                >
                  {status}
                </span>
              )
            })()}
          </div>
        </div>
        {unit.model?.retail_price && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                ₱
                {parseFloat(
                  unit.sale_price || unit.model.retail_price,
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              {unit.model.has_discount && (
                <>
                  <span className="text-sm text-gray-500 line-through">
                    ₱
                    {parseFloat(unit.model.retail_price).toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </span>
                  <span className="text-sm font-medium text-success">
                    Promo
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Unit Information */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Unit Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Indoor Serial Number
            </label>
            <p className="text-base font-medium font-mono bg-muted px-2 py-1 rounded">
              {unit.serial_number || "N/A"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Outdoor Serial Number
            </label>
            <p className="text-base font-medium font-mono bg-muted px-2 py-1 rounded">
              {unit.outdoor_serial_number || "N/A"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Model
            </label>
            <p className="text-base font-medium">{unit.model?.name || "N/A"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Brand
            </label>
            <p className="text-base font-medium">
              {unit.model?.brand?.name || "N/A"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Type
            </label>
            <p className="text-base font-medium capitalize">
              {unit.model?.aircon_type || "N/A"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Horsepower
            </label>
            <p className="text-base font-medium">
              {unit.model?.horsepower || "N/A"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Inverter
            </label>
            <p className="text-base font-medium">
              {unit.model?.is_inverter ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </div>

      {/* Status Information */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3">Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Current Status
            </label>
            <div className="mt-1">
              {(() => {
                const status = unit.unit_status ?? "Available"
                const variants: Record<
                  string,
                  { bg: string; text: string; ring: string }
                > = {
                  Installed: {
                    bg: "bg-emerald-50",
                    text: "text-success",
                    ring: "ring-emerald-600/20",
                  },
                  "For Installation": {
                    bg: "bg-blue-50",
                    text: "text-blue-700",
                    ring: "ring-blue-700/10",
                  },
                  Sold: {
                    bg: "bg-green-50",
                    text: "text-success",
                    ring: "ring-green-600/20",
                  },
                  Reserved: {
                    bg: "bg-yellow-50",
                    text: "text-yellow-800",
                    ring: "ring-yellow-600/20",
                  },
                  Available: {
                    bg: "bg-gray-50",
                    text: "text-gray-600",
                    ring: "ring-gray-500/10",
                  },
                }
                const v = variants[status] ?? variants.Available
                return (
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium ring-1 ring-inset ${v.bg} ${v.text} ${v.ring}`}
                  >
                    {status}
                  </span>
                )
              })()}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Availability
            </label>
            <p className="text-base font-medium">
              {unit.is_available_for_sale
                ? "Available for Sale"
                : "Not Available"}
            </p>
          </div>
        </div>
      </div>

      {/* Lifecycle Timeline */}
      {(() => {
        const lifecycleSteps = [
          { key: "Available", label: "Available", date: null },
          {
            key: "Reserved",
            label: "Reserved",
            date: unit.reserved_at
              ? formatDate(new Date(unit.reserved_at), "MMM d, yyyy")
              : null,
          },
          {
            key: "Sold",
            label: "Sold",
            date: unit.sold_date
              ? formatDate(new Date(unit.sold_date), "MMM d, yyyy")
              : null,
          },
          { key: "For Installation", label: "For Installation", date: null },
          {
            key: "Installed",
            label: "Installed",
            date: unit.installed_date
              ? formatDate(new Date(unit.installed_date), "MMM d, yyyy")
              : null,
          },
        ]

        const currentStatus = unit.unit_status ?? "Available"
        const currentIdx = lifecycleSteps.findIndex(
          (s) => s.key === currentStatus,
        )

        return (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Lifecycle</h3>
            <div className="flex items-start justify-between gap-0">
              {lifecycleSteps.map((step, i) => {
                const isDone = i <= currentIdx
                const isCurrent = false
                return (
                  <div
                    key={step.key}
                    className="flex flex-1 flex-col items-center relative"
                  >
                    {/* Connector line */}
                    {i > 0 && (
                      <div
                        className={cn(
                          "absolute top-3.5 right-1/2 w-full h-0.5",
                          isDone || isCurrent ? "bg-primary" : "bg-border",
                        )}
                      />
                    )}
                    {/* Circle */}
                    <div
                      className={cn(
                        "relative z-10 flex items-center justify-center size-7 rounded-full border-2 text-xs font-bold transition-all",
                        isDone &&
                          "bg-primary border-primary text-primary-foreground",
                        isCurrent &&
                          "bg-primary/15 border-primary text-primary ring-4 ring-primary/10",
                        !isDone &&
                          !isCurrent &&
                          "bg-muted border-border text-muted-foreground",
                      )}
                    >
                      {isDone ? <Check className="size-3.5" /> : i + 1}
                    </div>
                    <span
                      className={cn(
                        "mt-2 text-xs text-center font-medium leading-tight",
                        isCurrent
                          ? "text-primary font-semibold"
                          : isDone
                            ? "text-foreground"
                            : "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </span>
                    {step.date && (
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {step.date}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Sale Details */}
      {unit.sale && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Sale Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Sale ID
              </label>
              <p className="text-base font-medium font-mono">#{unit.sale}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <p className="text-base font-medium text-success">Sold</p>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Details */}
      {unit.is_reserved && unit.reserved_by && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Reservation Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Reserved By
              </label>
              <p className="text-base font-medium">
                {unit.reserved_by.full_name || "N/A"}
              </p>
            </div>
            {unit.reserved_by.contact_number && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Contact Number
                </label>
                <p className="text-base font-medium">
                  {unit.reserved_by.contact_number}
                </p>
              </div>
            )}
            {unit.reserved_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Reserved Date
                </label>
                <p className="text-base font-medium">
                  {new Date(unit.reserved_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            {unit.reserved_by.address && (
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Client Address
                </label>
                <p className="text-base font-medium">
                  {unit.reserved_by.address}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Installation Details */}
      {unit.installation_service && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Installation Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Service ID
              </label>
              <p className="text-base font-medium font-mono">
                #{unit.installation_service}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <p className="text-base font-medium text-blue-600">
                {unit.unit_status === "Installed"
                  ? "Installed"
                  : "For Installation"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Information */}
      {unit.model && (unit.model.retail_price || unit.model.selling_price) && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Pricing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Actual Sale Price (if different from model default) */}
            {unit.sale_price &&
              parseFloat(unit.sale_price) !==
                parseFloat(unit.model.selling_price || "0") && (
                <div className="sm:col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="text-sm font-medium text-blue-700">
                    Actual Sale Price (Custom)
                  </label>
                  <p className="text-lg font-bold text-blue-900">
                    ₱
                    {parseFloat(unit.sale_price).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              )}
            {unit.model.retail_price && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Retail Price
                </label>
                <p
                  className={`text-base font-medium ${unit.model.has_discount ? "line-through text-muted-foreground" : ""}`}
                >
                  ₱
                  {parseFloat(unit.model.retail_price).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            )}
            {unit.model.has_discount && unit.model.selling_price && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Selling Price (Model Default)
                </label>
                <p className="text-base font-semibold text-success">
                  ₱
                  {parseFloat(unit.model.selling_price).toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warranty Information */}
      {(unit.warranty_status ||
        unit.warranty_start_date ||
        unit.model?.parts_warranty_months ||
        unit.model?.labor_warranty_months) && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Warranty</h3>

          {/* Parts & Labor Warranty Cards — with per-type remaining days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* Parts Warranty */}
            <div className="rounded-lg border border-blue-200 bg-blue-100 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-2 rounded-full bg-blue-600" />
                <h4 className="text-sm font-semibold text-blue-950">
                  Parts Warranty
                </h4>
                {unit.parts_warranty_status && (
                  <span
                    className={`ml-auto inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      unit.parts_warranty_status === "Active"
                        ? "bg-green-50 text-success ring-green-600/20"
                        : unit.parts_warranty_status === "Expired"
                          ? "bg-red-50 text-destructive ring-red-600/20"
                          : "bg-gray-50 text-gray-600 ring-gray-500/10"
                    }`}
                  >
                    {unit.parts_warranty_status}
                  </span>
                )}
              </div>
              <p className="text-lg font-bold text-blue-900">
                {unit.model?.parts_warranty_months
                  ? `${unit.model.parts_warranty_months} months`
                  : "N/A"}
              </p>
              {unit.model?.parts_warranty_years && (
                <p className="text-xs text-blue-800">
                  ({unit.model.parts_warranty_years}{" "}
                  {unit.model.parts_warranty_years === 1 ? "year" : "years"})
                </p>
              )}
              {unit.parts_warranty_days_left !== undefined &&
                unit.parts_warranty_days_left > 0 && (
                  <p className="text-xs font-medium text-blue-700 mt-1">
                    {unit.parts_warranty_days_left} days remaining
                  </p>
                )}
              {unit.parts_warranty_end_date && (
                <p className="text-xs text-blue-800 mt-0.5">
                  Until:{" "}
                  {formatDate(
                    new Date(unit.parts_warranty_end_date),
                    "MMM dd, yyyy",
                  )}
                </p>
              )}
            </div>

            {/* Labor Warranty */}
            <div className="rounded-lg border border-amber-200 bg-amber-100 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-2 rounded-full bg-amber-600" />
                <h4 className="text-sm font-semibold text-amber-950">
                  Labor Warranty
                </h4>
                {unit.labor_warranty_status && (
                  <span
                    className={`ml-auto inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      unit.labor_warranty_status === "Active"
                        ? "bg-green-50 text-success ring-green-600/20"
                        : unit.labor_warranty_status === "Expired"
                          ? "bg-red-50 text-destructive ring-red-600/20"
                          : "bg-gray-50 text-gray-600 ring-gray-500/10"
                    }`}
                  >
                    {unit.labor_warranty_status}
                  </span>
                )}
              </div>
              <p className="text-lg font-bold text-amber-900">
                {unit.model?.labor_warranty_months
                  ? `${unit.model.labor_warranty_months} months`
                  : "N/A"}
              </p>
              {unit.model?.labor_warranty_years && (
                <p className="text-xs text-amber-800">
                  ({unit.model.labor_warranty_years}{" "}
                  {unit.model.labor_warranty_years === 1 ? "year" : "years"})
                </p>
              )}
              {unit.labor_warranty_days_left !== undefined &&
                unit.labor_warranty_days_left > 0 && (
                  <p className="text-xs font-medium text-amber-700 mt-1">
                    {unit.labor_warranty_days_left} days remaining
                  </p>
                )}
              {unit.labor_warranty_end_date && (
                <p className="text-xs text-amber-800 mt-0.5">
                  Until:{" "}
                  {formatDate(
                    new Date(unit.labor_warranty_end_date),
                    "MMM dd, yyyy",
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Warranty Dates */}
          {(unit.warranty_start_date || unit.warranty_end_date) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {unit.warranty_start_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Warranty Start
                  </label>
                  <p className="text-base font-medium">
                    {formatDate(
                      new Date(unit.warranty_start_date),
                      "MMM dd, yyyy",
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Free Cleaning Status */}
          {unit.free_cleaning_redeemed !== undefined && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Free Cleaning:
                </label>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                    unit.free_cleaning_status === "available"
                      ? "bg-green-50 text-success ring-green-600/20"
                      : unit.free_cleaning_status === "pending"
                        ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                        : unit.free_cleaning_status === "redeemed"
                          ? "bg-gray-50 text-gray-600 ring-gray-500/10"
                          : "bg-gray-50 text-gray-600 ring-gray-500/10"
                  }`}
                >
                  {unit.free_cleaning_status
                    ? unit.free_cleaning_status.charAt(0).toUpperCase() +
                      unit.free_cleaning_status.slice(1)
                    : unit.free_cleaning_redeemed
                      ? "Redeemed"
                      : "Available"}
                </span>
              </div>
              {unit.free_cleaning_redeemed &&
                unit.free_cleaning_redemption_date && (
                  <div className="text-xs text-muted-foreground pl-[110px]">
                    <p>
                      Redeemed on:{" "}
                      {formatDate(
                        new Date(unit.free_cleaning_redemption_date),
                        "MMM dd, yyyy",
                      )}
                    </p>
                    {unit.free_cleaning_service_id && (
                      <p>Service ID: #{unit.free_cleaning_service_id}</p>
                    )}
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* Warranty Claims */}
      {warrantyClaims.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Warranty Claims ({warrantyClaims.length})
          </h3>
          <div className="space-y-2">
            {warrantyClaims.map((claim) => {
              const sc =
                claimStatusConfig[claim.status] ?? claimStatusConfig.pending
              return (
                <div
                  key={claim.id}
                  className="rounded-lg border p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium capitalize">
                          {claim.claim_type?.replace(/_/g, " ")}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${sc.bg} ${sc.text} ${sc.ring}`}
                        >
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {claim.issue_description}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-2 shrink-0">
                      {claim.claim_date
                        ? formatDate(new Date(claim.claim_date), "MMM dd, yyyy")
                        : "—"}
                    </p>
                  </div>
                  {claim.technician_assessment && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Assessment:</span>{" "}
                        {claim.technician_assessment}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3">Dates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Created Date
            </label>
            <p className="text-base font-medium">
              {unit.created_at
                ? formatDate(new Date(unit.created_at), "MMM dd, yyyy")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
        {showEditButton && onEdit && (
          <Button
            onClick={() => {
              onClose()
              onEdit(unit)
            }}
          >
            <Eye className="size-4 mr-2" />
            Edit Unit
          </Button>
        )}
      </div>
    </div>
  )
}
