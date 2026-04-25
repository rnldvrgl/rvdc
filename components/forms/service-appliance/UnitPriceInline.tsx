"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type {
  AirconUnits,
  ServiceAppliance,
  ServiceAppliancePayload,
} from "@/lib/constants/interface"
import { formatCurrency } from "@/lib/utils/currency"
import { Edit } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface UnitPriceInlineProps {
  appliance: ServiceAppliance
  serviceId: number
  installationUnits: AirconUnits[]
  disabled: boolean
  updateAppliance: {
    mutateAsync: (args: {
      id: number
      data: ServiceAppliancePayload
    }) => Promise<unknown>
  }
  invalidateServiceQueries: () => Promise<void>
}

export function UnitPriceInline({
  appliance,
  serviceId,
  installationUnits,
  disabled,
  updateAppliance,
  invalidateServiceQueries,
}: UnitPriceInlineProps) {
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [editPrice, setEditPrice] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  const matchingUnit = appliance.serial_number
    ? installationUnits.find(
        (unit) => unit.serial_number === appliance.serial_number,
      )
    : null

  const defaultPrice = matchingUnit
    ? parseFloat(
        matchingUnit.sale_price ||
          matchingUnit.model?.selling_price ||
          matchingUnit.model?.retail_price ||
          "0",
      )
    : 0

  const soldPrice = appliance.unit_price
    ? parseFloat(appliance.unit_price)
    : defaultPrice

  const splitUnitPrice =
    appliance.installation_unit_fee != null
      ? parseFloat(appliance.installation_unit_fee)
      : null

  const currentPrice = splitUnitPrice ?? soldPrice

  const displayPrice = currentPrice

  const hasOverride =
    appliance.unit_price != null &&
    parseFloat(appliance.unit_price) !== defaultPrice

  const handleStartEdit = () => {
    setEditPrice(soldPrice > 0 ? soldPrice.toString() : "")
    setIsEditingPrice(true)
  }

  const handleCancelEdit = () => {
    setIsEditingPrice(false)
    setEditPrice("")
  }

  const handleSavePrice = async () => {
    setIsSaving(true)
    try {
      const newPrice = editPrice ? parseFloat(editPrice) : null
      await updateAppliance.mutateAsync({
        id: appliance.id,
        data: {
          service: serviceId,
          appliance_type_id: appliance.appliance_type?.id ?? null,
          labor_fee: parseFloat(appliance.labor_fee),
          status: appliance.status,
          unit_price:
            newPrice !== null ? Math.round(newPrice * 100) / 100 : null,
        },
      })
      toast.success("Unit price updated!")
      setIsEditingPrice(false)
      await invalidateServiceQueries()
    } catch {
      // handled by useApiMutation
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetToDefault = async () => {
    setIsSaving(true)
    try {
      await updateAppliance.mutateAsync({
        id: appliance.id,
        data: {
          service: serviceId,
          appliance_type_id: appliance.appliance_type?.id ?? null,
          labor_fee: parseFloat(appliance.labor_fee),
          status: appliance.status,
          unit_price: null,
        },
      })
      toast.success("Unit price reset to default!")
      setIsEditingPrice(false)
      await invalidateServiceQueries()
    } catch {
      // handled by useApiMutation
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-1">
        <p className="text-xs text-muted-foreground">Unit</p>
        {!disabled && !isEditingPrice && currentPrice > 0 && (
          <button
            type="button"
            onClick={handleStartEdit}
            title="Edit unit price"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit className="h-2.5 w-2.5" />
          </button>
        )}
      </div>

      {isEditingPrice ? (
        <div className="space-y-1.5 mt-0.5">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            placeholder={`₱${defaultPrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
            className="h-7 text-xs w-32"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSavePrice()
              if (e.key === "Escape") handleCancelEdit()
            }}
          />
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              onClick={handleSavePrice}
              disabled={isSaving}
              className="h-5 text-[10px] px-1.5"
            >
              Save
            </Button>
            {hasOverride && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetToDefault}
                disabled={isSaving}
                className="h-5 text-[10px] px-1.5"
              >
                Reset
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="h-5 text-[10px] px-1.5"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : displayPrice > 0 ? (
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold text-primary">
            {formatCurrency(displayPrice)}
          </span>
          {hasOverride && (
            <span
              className={`text-xs ${soldPrice < defaultPrice ? "text-success" : "text-orange-600"}`}
            >
              {soldPrice < defaultPrice
                ? `${formatCurrency(defaultPrice - soldPrice)} off`
                : `+${formatCurrency(soldPrice - defaultPrice)}`}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            {matchingUnit ? "Not set" : "Labor only"}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="text-xs text-primary hover:underline"
            >
              Set
            </button>
          )}
        </div>
      )}
    </div>
  )
}
