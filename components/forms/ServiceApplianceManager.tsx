"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MultiSelect } from "@/components/ui/multi-select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import AppliancePartsManager from "@/components/forms/AppliancePartsManager"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AirconUnits,
  ApplianceStatus,
  ServiceAppliance,
  ServiceAppliancePayload,
} from "@/lib/constants/interface"
import { useServiceApplianceMutations } from "@/lib/mutations/services/useServiceApplianceMutations"
import { useAirconUnits } from "@/lib/queries/useAircons"
import {
  useApplianceTypeChoices,
  useTechnicianChoices,
} from "@/lib/queries/useChoices"
import { formatCurrency } from "@/lib/utils/helpers"
import { useQueryClient } from "@tanstack/react-query"
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Package,
  Plus,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ServiceApplianceManagerProps {
  serviceId: number
  serviceType?: string
  appliances: ServiceAppliance[]
  installationUnits?: AirconUnits[]
  serviceTechnicians?: number[]
  onUpdate?: () => void | Promise<void>
  disabled?: boolean
  canManageParts?: boolean // Allow parts management even when appliance editing is disabled
}

interface EditingAppliance extends Partial<ServiceAppliancePayload> {
  tempId?: string
  assigned_technicians?: number[] // For multi-select UI
  appliance_type?: number | null
  // Aircon installation fields
  unit_type?: "brand_new" | "second_hand"
  unit_id?: number
}

const applianceStatusOptions: { value: ApplianceStatus; label: string }[] = [
  { value: "received", label: "Received" },
  { value: "diagnosed", label: "Diagnosed" },
  { value: "in_repair", label: "In Repair" },
  { value: "completed", label: "Completed" },
  { value: "ready_for_pickup", label: "Ready for Pickup" },
  { value: "delivered", label: "Delivered" },
]

export default function ServiceApplianceManager({
  serviceId,
  serviceType,
  appliances,
  installationUnits = [],
  serviceTechnicians = [],
  onUpdate,
  disabled = false,
  canManageParts = true,
}: ServiceApplianceManagerProps) {
  const queryClient = useQueryClient()
  const { data: applianceTypes = [] } = useApplianceTypeChoices()
  const { data: users = [], isLoading: usersLoading } = useTechnicianChoices()

  const isInstallation = serviceType === "installation"

  // Filter status options for installations
  const availableStatusOptions = isInstallation
    ? applianceStatusOptions.filter((opt) =>
        ["received", "completed", "delivered"].includes(opt.value),
      )
    : applianceStatusOptions

  // Fetch available aircon units for installation services
  const { data: availableUnits } = useAirconUnits({
    filter: { is_available_for_sale: true },
    limit: 100,
  })

  const { addAppliance, updateAppliance, deleteAppliance } =
    useServiceApplianceMutations()
  const [editingAppliance, setEditingAppliance] =
    useState<EditingAppliance | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [expandedAppliances, setExpandedAppliances] = useState<Set<number>>(
    new Set(),
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [applianceToDelete, setApplianceToDelete] = useState<number | null>(
    null,
  )
  const [showLaborDiscount, setShowLaborDiscount] = useState(false)

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedAppliances)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedAppliances(newExpanded)
  }

  const handleAdd = () => {
    setEditingAppliance({
      tempId: `temp-${Date.now()}`,
      appliance_type: null,
      brand: "",
      model: "",
      issue_reported: "",
      diagnosis_notes: "",
      status: "received",
      labor_fee: 0,
      labor_is_free: false,
      labor_original_amount: 0,
      labor_warranty_months: 0,
      unit_warranty_months: 0,
      warranty_notes: "",
      // Pre-populate with service-level technicians if available
      assigned_technicians: serviceTechnicians || [],
      // Initialize installation fields
      ...(isInstallation && {
        unit_type: "brand_new",
      }),
    })
    setIsAdding(true)
  }

  const handleEdit = (appliance: ServiceAppliance) => {
    setEditingAppliance({
      tempId: appliance.id.toString(),
      appliance_type: appliance.appliance_type?.id ?? null,
      brand: appliance.brand || "",
      model: appliance.model || "",
      issue_reported: appliance.issue_reported || "",
      diagnosis_notes: appliance.diagnosis_notes || "",
      status: appliance.status,
      labor_fee: parseFloat(appliance.labor_fee) || 0,
      labor_is_free: appliance.labor_is_free,
      labor_original_amount: appliance.labor_original_amount
        ? parseFloat(appliance.labor_original_amount)
        : 0,
      // Include existing labor discount fields
      labor_discount_amount: appliance.labor_discount_amount
        ? parseFloat(appliance.labor_discount_amount)
        : undefined,
      labor_discount_percentage: appliance.labor_discount_percentage
        ? parseFloat(appliance.labor_discount_percentage)
        : undefined,
      labor_discount_reason: appliance.labor_discount_reason || undefined,
      // Include warranty fields
      labor_warranty_months: appliance.labor_warranty_months || 0,
      unit_warranty_months: appliance.unit_warranty_months || 0,
      warranty_notes: appliance.warranty_notes || "",
      // Default to service-level technicians, or just the assigned technician if different
      assigned_technicians:
        serviceTechnicians && serviceTechnicians.length > 0
          ? serviceTechnicians
          : appliance.assigned_technician
            ? [appliance.assigned_technician]
            : [],
    })
    setEditingId(appliance.id)
    setIsAdding(false)
    // If there's an existing discount, show the discount section
    if (
      (appliance.labor_discount_amount &&
        parseFloat(appliance.labor_discount_amount) > 0) ||
      (appliance.labor_discount_percentage &&
        parseFloat(appliance.labor_discount_percentage) > 0)
    ) {
      setShowLaborDiscount(true)
    }
  }

  const handleSave = async () => {
    if (!editingAppliance) return

    // Validate labor discount doesn't exceed labor fee
    const laborFee = editingAppliance.labor_fee || 0
    const discountAmount = editingAppliance.labor_discount_amount || 0
    const discountPercentage = editingAppliance.labor_discount_percentage || 0

    // Only validate if discount is actually being applied (not 0)
    if (discountAmount > 0) {
      if (discountAmount > laborFee) {
        toast.error(
          `Labor discount (₱${discountAmount.toFixed(2)}) cannot exceed labor fee (₱${laborFee.toFixed(2)})`,
        )
        return
      }
    }

    if (discountPercentage > 0) {
      if (discountPercentage > 100) {
        toast.error("Labor discount percentage cannot exceed 100%")
        return
      }

      const calculatedDiscount = (laborFee * discountPercentage) / 100
      if (calculatedDiscount > laborFee) {
        toast.error(
          `Labor discount (${discountPercentage}% = ₱${calculatedDiscount.toFixed(2)}) cannot exceed labor fee (₱${laborFee.toFixed(2)})`,
        )
        return
      }
    }

    const newAppliance: ServiceAppliancePayload = {
      service: serviceId,
      appliance_type_id: editingAppliance.appliance_type ?? null,
      brand: editingAppliance.brand || "",
      model: editingAppliance.model || "",
      issue_reported: editingAppliance.issue_reported || "",
      diagnosis_notes: editingAppliance.diagnosis_notes || "",
      status: editingAppliance.status || "received",
      labor_fee: Math.round((editingAppliance.labor_fee || 0) * 100) / 100,
      labor_is_free: editingAppliance.labor_is_free || false,
      labor_original_amount:
        Math.round((editingAppliance.labor_original_amount || 0) * 100) / 100,
      // Send 0 to clear numeric fields, empty string for reason
      labor_discount_amount:
        editingAppliance.labor_discount_amount !== undefined &&
        editingAppliance.labor_discount_amount > 0
          ? Math.round(editingAppliance.labor_discount_amount * 100) / 100
          : 0,
      labor_discount_percentage:
        editingAppliance.labor_discount_percentage !== undefined &&
        editingAppliance.labor_discount_percentage > 0
          ? Math.round(editingAppliance.labor_discount_percentage * 100) / 100
          : 0,
      labor_discount_reason:
        editingAppliance.labor_discount_amount !== undefined &&
        editingAppliance.labor_discount_amount > 0
          ? editingAppliance.labor_discount_reason || ""
          : editingAppliance.labor_discount_percentage !== undefined &&
              editingAppliance.labor_discount_percentage > 0
            ? editingAppliance.labor_discount_reason || ""
            : "",
      // Warranty fields
      labor_warranty_months: editingAppliance.labor_warranty_months || 0,
      unit_warranty_months: editingAppliance.unit_warranty_months || 0,
      warranty_notes: editingAppliance.warranty_notes || "",
      // Convert array back to single technician (backend supports single only)
      // Use first technician in the array
      assigned_technician:
        editingAppliance.assigned_technicians &&
        editingAppliance.assigned_technicians.length > 0
          ? editingAppliance.assigned_technicians[0]
          : null,
      serial_number: editingAppliance.serial_number || undefined,
      // Include aircon installation data for installation services
      ...(isInstallation &&
        editingAppliance.unit_id && {
          aircon_installation_data: {
            unit_type: editingAppliance.unit_type || "brand_new",
            unit_id: editingAppliance.unit_id,
          },
        }),
    }

    try {
      if (isAdding) {
        // Add new appliance via API
        await addAppliance.mutateAsync(newAppliance)
        toast.success("Appliance added successfully!")
      } else if (editingId) {
        // Update existing appliance via API
        await updateAppliance.mutateAsync({ id: editingId, data: newAppliance })
        toast.success("Appliance updated successfully!")
      }

      setEditingAppliance(null)
      setEditingId(null)
      setIsAdding(false)

      // Small delay for backend to recalculate totals
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Invalidate all service-related queries to mark them as stale
      await queryClient.invalidateQueries({
        queryKey: ["service"],
      })
      await queryClient.invalidateQueries({
        queryKey: ["service-appliances"],
      })
      await queryClient.invalidateQueries({
        queryKey: ["appliance-items"],
      })

      // Trigger parent refresh which will refetch with fresh data
      if (onUpdate) {
        await onUpdate()
      }
    } catch {
      // Error is handled by useApiMutation (shows toast automatically)
    }
  }

  const handleCancel = () => {
    setEditingAppliance(null)
    setEditingId(null)
    setIsAdding(false)
  }

  const handleDelete = (applianceId: number) => {
    setApplianceToDelete(applianceId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (applianceToDelete) {
      try {
        await deleteAppliance.mutateAsync({ id: applianceToDelete, serviceId })
        toast.success("Appliance deleted successfully!")
        setDeleteDialogOpen(false)
        setApplianceToDelete(null)

        // Small delay for backend to recalculate totals
        await new Promise((resolve) => setTimeout(resolve, 150))

        // Invalidate all service-related queries to mark them as stale
        await queryClient.invalidateQueries({
          queryKey: ["service"],
        })
        await queryClient.invalidateQueries({
          queryKey: ["service-appliances"],
        })
        await queryClient.invalidateQueries({
          queryKey: ["appliance-items"],
        })

        // Trigger parent refresh which will refetch with fresh data
        if (onUpdate) {
          await onUpdate()
        }
      } catch {
        // Error is handled by useApiMutation (shows toast automatically)
        setDeleteDialogOpen(false)
        setApplianceToDelete(null)
      }
    }
  }

  const getStatusLabel = (status: ApplianceStatus) => {
    const option = availableStatusOptions.find((o) => o.value === status)
    return option?.label || status
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-lg">
          {isInstallation ? "Units" : "Appliances"}
          <Badge
            variant="secondary"
            className="ml-2"
          >
            {appliances.length}
          </Badge>
        </CardTitle>
        {!disabled && !editingAppliance && (
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
          >
            <Plus className="mr-2 h-4 w-4" />
            {isInstallation ? "Add Unit" : "Add Appliance"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {editingAppliance ? (
          <div className="space-y-4 rounded-lg border p-4">
            <h4 className="font-medium">
              {isAdding
                ? isInstallation
                  ? "Add Unit"
                  : "Add Appliance"
                : isInstallation
                  ? "Edit Unit"
                  : "Edit Appliance"}
            </h4>

            <div className="grid grid-cols-2 gap-4">
              {!isInstallation && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Appliance Type</Label>
                  <ComboBox
                    options={[{ value: "none", label: "N/A" }].concat(
                      applianceTypes.map((type) => ({
                        value: type.id.toString(),
                        label: type.name,
                      })),
                    )}
                    value={
                      editingAppliance.appliance_type
                        ? editingAppliance.appliance_type.toString()
                        : "none"
                    }
                    onChange={(value) =>
                      setEditingAppliance({
                        ...editingAppliance,
                        appliance_type: value === "none" ? null : Number(value),
                      })
                    }
                    placeholder="Select type"
                    searchPlaceholder="Search appliance types..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <ComboBox
                  options={availableStatusOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  value={editingAppliance.status || "received"}
                  onChange={(value) =>
                    setEditingAppliance({
                      ...editingAppliance,
                      status: value as ApplianceStatus,
                    })
                  }
                  placeholder="Select status"
                  searchPlaceholder="Search status..."
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label className="text-sm font-medium">
                  Assigned Technicians
                </Label>
                <MultiSelect
                  options={users.map((tech) => ({
                    value: tech.id.toString(),
                    label: tech.full_name,
                  }))}
                  selected={
                    editingAppliance.assigned_technicians
                      ?.filter((id) => id !== undefined && id !== null)
                      .map((id) => id.toString()) ?? []
                  }
                  onChange={(values: string[]) => {
                    setEditingAppliance({
                      ...editingAppliance,
                      assigned_technicians: values.map((v: string) =>
                        Number(v),
                      ),
                    })
                  }}
                  placeholder="Select technicians (optional)"
                  disabled={usersLoading}
                />
              </div>

              {/* Aircon Installation Fields */}
              {isInstallation && (
                <>
                  {/* Unit Type Selector */}
                  <div className="space-y-3 pt-3 border-t col-span-2">
                    <Label className="text-sm font-medium">Unit Type</Label>
                    <RadioGroup
                      value={editingAppliance.unit_type || "brand_new"}
                      onValueChange={(value: "brand_new" | "second_hand") => {
                        setEditingAppliance({
                          ...editingAppliance,
                          unit_type: value,
                          // Clear fields when switching types
                          unit_id: undefined,
                          brand: "",
                          model: "",
                          serial_number: "",
                        })
                      }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="brand_new"
                          id="brand_new"
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor="brand_new"
                          className="flex-1 cursor-pointer"
                        >
                          <div>
                            <div className="font-medium">Brand New</div>
                            <div className="text-xs text-muted-foreground">
                              Select from inventory
                            </div>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="second_hand"
                          id="second_hand"
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor="second_hand"
                          className="flex-1 cursor-pointer"
                        >
                          <div>
                            <div className="font-medium">Second Hand</div>
                            <div className="text-xs text-muted-foreground">
                              Enter details manually
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Brand New Unit Selector */}
                  {editingAppliance.unit_type === "brand_new" && (
                    <div className="space-y-3 col-span-2">
                      <Label className="text-sm font-medium">
                        Select Aircon Unit
                      </Label>
                      <ComboBox
                        value={editingAppliance.unit_id?.toString() || null}
                        onChange={(value) => {
                          const unitId = value ? Number(value) : undefined
                          const selectedUnit = availableUnits?.results.find(
                            (u) => u.id === unitId,
                          )
                          setEditingAppliance({
                            ...editingAppliance,
                            unit_id: unitId,
                            unit_type: "brand_new",
                            // Auto-fill brand, model, serial from selected unit
                            brand: selectedUnit?.model?.brand?.name || "",
                            model: selectedUnit?.model?.name || "",
                            serial_number: selectedUnit?.serial_number || "",
                          })
                        }}
                        options={
                          availableUnits?.results.map((unit) => ({
                            value: unit.id.toString(),
                            label: `${unit.model?.brand?.name || ""} ${unit.model?.name || ""} - SN: ${unit.serial_number}`,
                          })) || []
                        }
                        placeholder="Select unit from inventory"
                        searchPlaceholder="Search units..."
                      />
                    </div>
                  )}

                  {/* Display selected unit details */}
                  {editingAppliance.unit_type === "brand_new" &&
                    editingAppliance.unit_id &&
                    (() => {
                      const selectedUnit = availableUnits?.results.find(
                        (u) => u.id === editingAppliance.unit_id,
                      )
                      if (!selectedUnit) return null

                      return (
                        <div className="col-span-2 rounded-lg border bg-muted/50 p-4 space-y-2">
                          <h4 className="text-sm font-semibold mb-3">
                            Unit Details
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Brand</p>
                              <p className="font-medium">
                                {selectedUnit.model?.brand?.name || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Model</p>
                              <p className="font-medium">
                                {selectedUnit.model?.name || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Serial Number
                              </p>
                              <p className="font-medium">
                                {selectedUnit.serial_number || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Type</p>
                              <p className="font-medium">
                                {selectedUnit.model?.aircon_type?.name || "N/A"}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-muted-foreground">
                                Retail Price
                              </p>
                              <p className="text-lg font-bold text-primary">
                                {selectedUnit.model?.retail_price
                                  ? `₱${parseFloat(selectedUnit.model.retail_price).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                  {/* Second Hand Manual Entry Fields */}
                  {editingAppliance.unit_type === "second_hand" && (
                    <>
                      <div className="space-y-2 col-span-2">
                        <Label className="text-sm font-medium">Brand</Label>
                        <Input
                          value={editingAppliance.brand || ""}
                          onChange={(e) =>
                            setEditingAppliance({
                              ...editingAppliance,
                              brand: e.target.value,
                            })
                          }
                          placeholder="e.g., Samsung, LG, Carrier"
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label className="text-sm font-medium">Model</Label>
                        <Input
                          value={editingAppliance.model || ""}
                          onChange={(e) =>
                            setEditingAppliance({
                              ...editingAppliance,
                              model: e.target.value,
                            })
                          }
                          placeholder="Model number"
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label className="text-sm font-medium">
                          Serial Number{" "}
                          <span className="text-muted-foreground text-xs">
                            (optional)
                          </span>
                        </Label>
                        <Input
                          value={editingAppliance.serial_number || ""}
                          onChange={(e) =>
                            setEditingAppliance({
                              ...editingAppliance,
                              serial_number: e.target.value,
                            })
                          }
                          placeholder="Serial number of unit"
                        />
                      </div>
                    </>
                  )}

                  <Separator className="col-span-2" />
                </>
              )}

              {!isInstallation && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Brand</Label>
                    <Input
                      value={editingAppliance.brand || ""}
                      onChange={(e) =>
                        setEditingAppliance({
                          ...editingAppliance,
                          brand: e.target.value,
                        })
                      }
                      placeholder="e.g., Samsung, LG"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Model</Label>
                    <Input
                      value={editingAppliance.model || ""}
                      onChange={(e) =>
                        setEditingAppliance({
                          ...editingAppliance,
                          model: e.target.value,
                        })
                      }
                      placeholder="Model number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Serial Number{" "}
                      <span className="text-muted-foreground text-xs">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      value={editingAppliance.serial_number || ""}
                      onChange={(e) =>
                        setEditingAppliance({
                          ...editingAppliance,
                          serial_number: e.target.value,
                        })
                      }
                      placeholder="Serial number of appliance"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {isInstallation ? "Installation Fee (₱)" : "Labor Fee (₱)"}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingAppliance.labor_fee || 0}
                  onChange={(e) =>
                    setEditingAppliance({
                      ...editingAppliance,
                      labor_fee: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="labor_is_free"
                  checked={editingAppliance.labor_is_free || false}
                  onCheckedChange={(checked) =>
                    setEditingAppliance({
                      ...editingAppliance,
                      labor_is_free: checked === true,
                    })
                  }
                  className="cursor-pointer"
                />
                <Label
                  htmlFor="labor_is_free"
                  className="text-sm font-medium cursor-pointer"
                >
                  Labor is Free
                </Label>
              </div>

              {/* Labor Discount Section */}
              <div className="space-y-3 pt-3 border-t col-span-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLaborDiscount(!showLaborDiscount)}
                  className="w-full text-sm p-0 h-auto"
                >
                  {showLaborDiscount ? (
                    <ChevronUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  )}
                  Labor Discount (Optional)
                </Button>

                {showLaborDiscount && (
                  <div className="grid grid-cols-3 gap-3 pl-4 border-l-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Type</Label>
                      <ComboBox
                        options={[
                          { value: "none", label: "None" },
                          { value: "percentage", label: "%" },
                          { value: "fixed", label: "₱" },
                        ]}
                        value={
                          editingAppliance.labor_discount_amount !== undefined
                            ? "fixed"
                            : editingAppliance.labor_discount_percentage !==
                                undefined
                              ? "percentage"
                              : "none"
                        }
                        onChange={(value) => {
                          if (value === "none") {
                            setEditingAppliance({
                              ...editingAppliance,
                              labor_discount_amount: undefined,
                              labor_discount_percentage: undefined,
                              labor_discount_reason: undefined,
                            })
                          } else if (value === "fixed") {
                            setEditingAppliance({
                              ...editingAppliance,
                              labor_discount_amount: 0,
                              labor_discount_percentage: undefined,
                            })
                          } else {
                            setEditingAppliance({
                              ...editingAppliance,
                              labor_discount_amount: undefined,
                              labor_discount_percentage: 0,
                            })
                          }
                        }}
                        placeholder="Select type"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Amount</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          editingAppliance.labor_discount_amount ??
                          editingAppliance.labor_discount_percentage ??
                          ""
                        }
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          if (
                            editingAppliance.labor_discount_amount !== undefined
                          ) {
                            setEditingAppliance({
                              ...editingAppliance,
                              labor_discount_amount: value,
                            })
                          } else if (
                            editingAppliance.labor_discount_percentage !==
                            undefined
                          ) {
                            setEditingAppliance({
                              ...editingAppliance,
                              labor_discount_percentage: value,
                            })
                          }
                        }}
                        disabled={
                          editingAppliance.labor_discount_amount ===
                            undefined &&
                          editingAppliance.labor_discount_percentage ===
                            undefined
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Reason</Label>
                      <Input
                        placeholder="Optional"
                        value={editingAppliance.labor_discount_reason || ""}
                        onChange={(e) =>
                          setEditingAppliance({
                            ...editingAppliance,
                            labor_discount_reason: e.target.value,
                          })
                        }
                        disabled={
                          editingAppliance.labor_discount_amount ===
                            undefined &&
                          editingAppliance.labor_discount_percentage ===
                            undefined
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!isInstallation && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Issue Reported</Label>
                  <Textarea
                    value={editingAppliance.issue_reported || ""}
                    onChange={(e) =>
                      setEditingAppliance({
                        ...editingAppliance,
                        issue_reported: e.target.value,
                      })
                    }
                    placeholder="Describe the issue reported by the client"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Diagnosis Notes</Label>
                  <Textarea
                    value={editingAppliance.diagnosis_notes || ""}
                    onChange={(e) =>
                      setEditingAppliance({
                        ...editingAppliance,
                        diagnosis_notes: e.target.value,
                      })
                    }
                    placeholder="Technician's diagnosis and findings"
                    rows={2}
                  />
                </div>
              </>
            )}

            {/* Warranty Information */}
            <div className="space-y-3 pt-3 border-t">
              <h5 className="text-sm font-semibold">Warranty Information</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Labor Warranty (months)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingAppliance.labor_warranty_months || 0}
                    onChange={(e) =>
                      setEditingAppliance({
                        ...editingAppliance,
                        labor_warranty_months: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0 for no warranty"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Unit Warranty (months)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingAppliance.unit_warranty_months || 0}
                    onChange={(e) =>
                      setEditingAppliance({
                        ...editingAppliance,
                        unit_warranty_months: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0 for no warranty"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-medium">
                    Warranty Notes
                    <span className="text-muted-foreground text-xs ml-1">
                      (e.g., compressor warranty, parts coverage)
                    </span>
                  </Label>
                  <Textarea
                    value={editingAppliance.warranty_notes || ""}
                    onChange={(e) =>
                      setEditingAppliance({
                        ...editingAppliance,
                        warranty_notes: e.target.value,
                      })
                    }
                    placeholder="Additional warranty details..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleCancel}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                variant="success"
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        ) : appliances.length > 0 ? (
          <div className="space-y-3">
            {appliances.map((appliance) => (
              <Card
                key={appliance.id}
                className="overflow-hidden"
              >
                {/* Header Section */}
                <CardHeader className="border-b flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Title Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-semibold">
                        {appliance.appliance_type?.name ||
                          (appliance.brand && appliance.model
                            ? `${appliance.brand} ${appliance.model}`
                            : "Unknown Appliance")}
                      </h4>
                      <Badge
                        variant="outline"
                        className="font-medium"
                      >
                        {getStatusLabel(appliance.status)}
                      </Badge>
                    </div>

                    {/* Brand/Model Row */}
                    {(appliance.brand || appliance.model) && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Package className="h-3.5 w-3.5" />
                        <span className="font-medium">
                          {appliance.brand || "—"}
                        </span>
                        {appliance.model && (
                          <>
                            <span>•</span>
                            <span>{appliance.model}</span>
                          </>
                        )}
                      </p>
                    )}

                    {/* Technician Row */}
                    {serviceTechnicians && serviceTechnicians.length > 0 && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        <span>Assigned to:</span>
                        <span className="font-medium">
                          {serviceTechnicians
                            .map((techId) => {
                              const tech = users.find((u) => u.id === techId)
                              return tech?.full_name
                            })
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(appliance.id)}
                          className="h-8 w-8 p-0"
                        >
                          {expandedAppliances.has(appliance.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {expandedAppliances.has(appliance.id)
                            ? "Hide parts used"
                            : canManageParts && !disabled
                              ? "Show and manage parts used"
                              : "Show parts used"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    {!disabled && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(appliance)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit appliance details</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(appliance.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete appliance and all its parts</p>
                          </TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </CardHeader>

                {/* Content Section */}
                <CardContent className="space-y-4">
                  {/* Issue Reported */}
                  {appliance.issue_reported && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Issue Reported
                      </Label>
                      <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded-md">
                        {appliance.issue_reported}
                      </p>
                    </div>
                  )}

                  {/* Diagnosis Notes */}
                  {appliance.diagnosis_notes && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Diagnosis Notes
                      </Label>
                      <p className="text-sm leading-relaxed bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-900">
                        {appliance.diagnosis_notes}
                      </p>
                    </div>
                  )}

                  {/* Financial Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Labor Fee Card */}
                    <Card className="border-2">
                      <CardContent>
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                            Labor Fee
                          </Label>
                          {appliance.labor_is_free ? (
                            <Badge
                              variant="success"
                              className="text-base px-3 py-1"
                            >
                              FREE
                            </Badge>
                          ) : (
                            <div className="space-y-1">
                              {((appliance.labor_discount_amount &&
                                parseFloat(appliance.labor_discount_amount) >
                                  0) ||
                                (appliance.labor_discount_percentage &&
                                  parseFloat(
                                    appliance.labor_discount_percentage,
                                  ) > 0)) && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm line-through text-muted-foreground">
                                    {formatCurrency(
                                      parseFloat(appliance.labor_fee),
                                    )}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-green-600 border-green-600"
                                  >
                                    {appliance.labor_discount_percentage &&
                                    parseFloat(
                                      appliance.labor_discount_percentage,
                                    ) > 0
                                      ? `${appliance.labor_discount_percentage}% off`
                                      : `₱${appliance.labor_discount_amount} off`}
                                  </Badge>
                                </div>
                              )}
                              <p className="text-2xl font-bold text-primary">
                                {formatCurrency(
                                  parseFloat(
                                    appliance.discounted_labor_fee ||
                                      appliance.labor_fee,
                                  ),
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Unit Price Card - For Installation Services */}
                    {isInstallation &&
                      (() => {
                        // Find matching unit by serial number
                        const matchingUnit = appliance.serial_number
                          ? installationUnits.find(
                              (unit) =>
                                unit.serial_number === appliance.serial_number,
                            )
                          : null

                        return (
                          <Card className="border-2">
                            <CardContent>
                              <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                  Unit Price
                                </Label>
                                {matchingUnit && matchingUnit.model ? (
                                  <div className="space-y-1">
                                    <p className="text-2xl font-bold text-primary">
                                      {formatCurrency(
                                        parseFloat(
                                          matchingUnit.model.promo_price || "0",
                                        ),
                                      )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {matchingUnit.model.brand?.name}{" "}
                                      {matchingUnit.model.name}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    No unit linked
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })()}

                    {/* Parts Cost Card */}
                    <Card className="border-2">
                      <CardContent>
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                            Parts Cost
                          </Label>
                          {appliance.items_used &&
                          appliance.items_used.length > 0 ? (
                            <div className="space-y-1">
                              {/* Check if any parts have discounts */}
                              {(() => {
                                const totalOriginal =
                                  appliance.items_used.reduce(
                                    (sum, part) =>
                                      sum +
                                      parseFloat(part.item_price) *
                                        part.quantity,
                                    0,
                                  )
                                const totalFinal = parseFloat(
                                  appliance.total_parts_cost || "0",
                                )
                                const hasDiscount = totalOriginal > totalFinal

                                return (
                                  <>
                                    {hasDiscount && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm line-through text-muted-foreground">
                                          {formatCurrency(totalOriginal)}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-green-600 border-green-600 text-xs"
                                        >
                                          {formatCurrency(
                                            totalOriginal - totalFinal,
                                          )}{" "}
                                          off
                                        </Badge>
                                      </div>
                                    )}
                                    <p className="text-2xl font-bold text-primary">
                                      {formatCurrency(totalFinal)}
                                    </p>
                                  </>
                                )
                              })()}
                              <p className="text-xs text-muted-foreground">
                                {appliance.items_used.length}{" "}
                                {appliance.items_used.length === 1
                                  ? "item"
                                  : "items"}{" "}
                                used
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No parts used
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Warranty Information */}
                  {(appliance.labor_warranty_months ||
                    appliance.unit_warranty_months ||
                    appliance.warranty_notes) && (
                    <Card className="border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                      <CardContent>
                        <div className="space-y-3">
                          <Label className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300">
                            Warranty Information
                          </Label>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {appliance.labor_warranty_months > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                  Labor Warranty
                                </p>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold">
                                    {appliance.labor_warranty_months} months
                                  </p>
                                  {appliance.is_labor_warranty_active && (
                                    <Badge
                                      variant="success"
                                      className="text-xs"
                                    >
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                {appliance.labor_warranty_end_date && (
                                  <p className="text-xs text-muted-foreground">
                                    Until:{" "}
                                    {new Date(
                                      appliance.labor_warranty_end_date,
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            )}

                            {appliance.unit_warranty_months > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                  Unit Warranty
                                </p>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold">
                                    {appliance.unit_warranty_months} months
                                  </p>
                                  {appliance.is_unit_warranty_active && (
                                    <Badge
                                      variant="success"
                                      className="text-xs"
                                    >
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                {appliance.unit_warranty_end_date && (
                                  <p className="text-xs text-muted-foreground">
                                    Until:{" "}
                                    {new Date(
                                      appliance.unit_warranty_end_date,
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {appliance.warranty_notes && (
                            <div className="space-y-1 pt-2 border-t border-blue-200 dark:border-blue-800">
                              <p className="text-xs text-muted-foreground">
                                Notes
                              </p>
                              <p className="text-sm leading-relaxed">
                                {appliance.warranty_notes}
                              </p>
                            </div>
                          )}

                          {appliance.warranty_start_date && (
                            <p className="text-xs text-muted-foreground pt-1">
                              Warranty started:{" "}
                              {new Date(
                                appliance.warranty_start_date,
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Parts List (when collapsed) */}
                  {!expandedAppliances.has(appliance.id) &&
                    appliance.items_used &&
                    appliance.items_used.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                          Parts Summary
                        </Label>
                        <div className="bg-muted/30 rounded-md p-3">
                          <div className="space-y-1.5">
                            {appliance.items_used.map((part) => {
                              const hasDiscount =
                                (part.discount_amount &&
                                  parseFloat(part.discount_amount) > 0) ||
                                (part.discount_percentage &&
                                  parseFloat(part.discount_percentage) > 0)

                              return (
                                <div
                                  key={part.id}
                                  className="flex justify-between items-center text-sm gap-2"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-muted-foreground truncate">
                                      {part.item_name}{" "}
                                      <span className="text-xs">
                                        (x{part.quantity})
                                      </span>
                                    </span>
                                    {hasDiscount && (
                                      <Badge
                                        variant="outline"
                                        className="text-green-600 border-green-600 text-xs shrink-0"
                                      >
                                        {part.discount_percentage &&
                                        parseFloat(part.discount_percentage) > 0
                                          ? `${part.discount_percentage}% off`
                                          : `₱${part.discount_amount} off`}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end shrink-0">
                                    {hasDiscount && (
                                      <span className="text-xs line-through text-muted-foreground">
                                        {formatCurrency(
                                          parseFloat(part.item_price) *
                                            part.quantity,
                                        )}
                                      </span>
                                    )}
                                    <span className="font-medium">
                                      {formatCurrency(part.line_total)}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                </CardContent>

                {/* Expandable Parts Section */}
                {expandedAppliances.has(appliance.id) && (
                  <div className="border-t bg-muted/10">
                    <div className="p-4">
                      <AppliancePartsManager
                        applianceId={appliance.id}
                        disabled={!canManageParts}
                        onUpdate={onUpdate}
                      />
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">
              No appliances added yet.
              {!disabled &&
                " Click 'Add Appliance' to add an appliance to this service."}
            </p>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Appliance"
        description="Are you sure you want to delete this appliance? This will also delete all associated parts and cannot be undone."
      />
    </Card>
  )
}
