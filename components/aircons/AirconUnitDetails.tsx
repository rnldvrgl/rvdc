"use client"

import { Button } from "@/components/ui/button"
import { AirconUnits } from "@/lib/constants/interface"
import { Eye } from "lucide-react"

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
  return (
    <div className="space-y-6 p-6">
      {/* Quick Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
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
            {unit.installation_service ? (
              <span className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                For Installation
              </span>
            ) : unit.is_sold ? (
              <span className="inline-flex items-center rounded-md bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                Sold
              </span>
            ) : unit.is_reserved ? (
              <span className="inline-flex items-center rounded-md bg-yellow-50 px-3 py-1.5 text-sm font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                Reserved
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                Available
              </span>
            )}
          </div>
        </div>
        {unit.model?.retail_price && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                ₱
                {unit.model.has_discount
                  ? (
                      parseFloat(unit.model.retail_price) *
                      (1 -
                        parseFloat(unit.model.discount_percentage || "0") / 100)
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : parseFloat(unit.model.retail_price).toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
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
                  <span className="text-sm font-medium text-green-600">
                    {unit.model.discount_percentage}% OFF
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
              {unit.installation_service ? (
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  For Installation
                </span>
              ) : unit.is_sold ? (
                <span className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Sold
                </span>
              ) : unit.is_reserved ? (
                <span className="inline-flex items-center rounded-md bg-yellow-50 px-2.5 py-1 text-sm font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                  Reserved
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-gray-50 px-2.5 py-1 text-sm font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                  Available
                </span>
              )}
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
              <p className="text-base font-medium text-green-600">Sold</p>
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
                Scheduled for Installation
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Information */}
      {unit.model &&
        (unit.model.retail_price || unit.model.discount_percentage) && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">Pricing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {unit.model.retail_price && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Retail Price
                  </label>
                  <p className="text-base font-medium">
                    ₱
                    {parseFloat(unit.model.retail_price).toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </p>
                </div>
              )}
              {unit.model.discount_percentage &&
                parseFloat(unit.model.discount_percentage) > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Discount
                    </label>
                    <p className="text-base font-medium text-green-600">
                      {unit.model.discount_percentage}% OFF
                    </p>
                  </div>
                )}
              {unit.model.has_discount && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Sale Price
                  </label>
                  <p className="text-base font-semibold text-green-600">
                    ₱
                    {(
                      parseFloat(unit.model.retail_price) *
                      (1 -
                        parseFloat(unit.model.discount_percentage || "0") / 100)
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Warranty Information */}
      {(unit.warranty_status || unit.warranty_start_date) && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Warranty</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {unit.warranty_status && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Warranty Status
                </label>
                <p className="text-base font-medium">{unit.warranty_status}</p>
              </div>
            )}
            {unit.warranty_start_date && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Warranty Start
                </label>
                <p className="text-base font-medium">
                  {new Date(unit.warranty_start_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {unit.warranty_end_date && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Warranty End
                </label>
                <p className="text-base font-medium">
                  {new Date(unit.warranty_end_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {unit.warranty_days_left !== undefined &&
              unit.warranty_days_left > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Days Remaining
                  </label>
                  <p className="text-base font-medium">
                    {unit.warranty_days_left} days
                  </p>
                </div>
              )}
            {unit.warranty_period_months && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Warranty Period
                </label>
                <p className="text-base font-medium">
                  {unit.warranty_period_months} months
                </p>
              </div>
            )}
            {unit.free_cleaning_redeemed !== undefined && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Free Cleaning
                </label>
                <p className="text-base font-medium">
                  {unit.free_cleaning_redeemed ? "Redeemed" : "Available"}
                </p>
              </div>
            )}
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
                ? new Date(unit.created_at).toLocaleDateString()
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
