"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MultiSelect } from "@/components/ui/multi-select"
import { Textarea } from "@/components/ui/textarea"

import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import AppliancePartsManager from "@/components/forms/AppliancePartsManager"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ApplianceStatus,
  ServiceAppliance,
  ServiceAppliancePayload,
} from "@/lib/constants/interface"
import { useServiceApplianceMutations } from "@/lib/mutations/services/useServiceApplianceMutations"
import {
  useApplianceTypeChoices,
  useTechnicianChoices,
} from "@/lib/queries/useChoices"
import { formatCurrency } from "@/lib/utils/helpers"
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
  appliances: ServiceAppliance[]
  serviceTechnicians?: number[]
  onUpdate?: () => void
  disabled?: boolean
  canManageParts?: boolean // Allow parts management even when appliance editing is disabled
}

interface EditingAppliance extends Partial<ServiceAppliancePayload> {
  tempId?: string
  assigned_technicians?: number[] // For multi-select UI
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
  appliances,
  serviceTechnicians = [],
  onUpdate,
  disabled = false,
  canManageParts = true,
}: ServiceApplianceManagerProps) {
  const { data: applianceTypes = [] } = useApplianceTypeChoices()
  const { data: users = [], isLoading: usersLoading } = useTechnicianChoices()
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
      // Pre-populate with service-level technicians if available
      assigned_technicians: serviceTechnicians || [],
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
  }

  const handleSave = () => {
    if (!editingAppliance) return

    const newAppliance: ServiceAppliancePayload = {
      service: serviceId,
      appliance_type: editingAppliance.appliance_type ?? null,
      brand: editingAppliance.brand || "",
      model: editingAppliance.model || "",
      issue_reported: editingAppliance.issue_reported || "",
      diagnosis_notes: editingAppliance.diagnosis_notes || "",
      status: editingAppliance.status || "received",
      labor_fee: editingAppliance.labor_fee || 0,
      labor_is_free: editingAppliance.labor_is_free || false,
      labor_original_amount: editingAppliance.labor_original_amount || 0,
      // Convert array back to single technician (backend supports single only)
      // Use first technician in the array
      assigned_technician:
        editingAppliance.assigned_technicians &&
        editingAppliance.assigned_technicians.length > 0
          ? editingAppliance.assigned_technicians[0]
          : null,
    }

    if (isAdding) {
      // Add new appliance via API
      addAppliance.mutate(newAppliance, {
        onSuccess: () => {
          toast.success("Appliance added successfully!")
          setEditingAppliance(null)
          setIsAdding(false)
          onUpdate?.()
        },
        onError: () => {
          toast.error("Failed to add appliance")
        },
      })
    } else if (editingId) {
      // Update existing appliance via API
      updateAppliance.mutate(
        { id: editingId, data: newAppliance },
        {
          onSuccess: () => {
            toast.success("Appliance updated successfully!")
            setEditingAppliance(null)
            setEditingId(null)
            setIsAdding(false)
            onUpdate?.()
          },
          onError: () => {
            toast.error("Failed to update appliance")
          },
        },
      )
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

  const confirmDelete = () => {
    if (applianceToDelete) {
      deleteAppliance.mutate(
        { id: applianceToDelete, serviceId },
        {
          onSuccess: () => {
            toast.success("Appliance deleted successfully!")
            setDeleteDialogOpen(false)
            setApplianceToDelete(null)
            onUpdate?.()
          },
          onError: () => {
            toast.error("Failed to delete appliance")
            setDeleteDialogOpen(false)
            setApplianceToDelete(null)
          },
        },
      )
    }
  }

  const getStatusLabel = (status: ApplianceStatus) => {
    const option = applianceStatusOptions.find((o) => o.value === status)
    return option?.label || status
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Appliances</CardTitle>
        {!disabled && !editingAppliance && (
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Appliance
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {editingAppliance ? (
          <div className="space-y-4 rounded-lg border p-4">
            <h4 className="font-medium">
              {isAdding ? "Add New Appliance" : "Edit Appliance"}
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Appliance Type</Label>
                <Select
                  value={
                    editingAppliance.appliance_type
                      ? editingAppliance.appliance_type.toString()
                      : "none"
                  }
                  onValueChange={(value) =>
                    setEditingAppliance({
                      ...editingAppliance,
                      appliance_type: value === "none" ? null : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">N/A</SelectItem>
                    {applianceTypes.map((type) => (
                      <SelectItem
                        key={type.id}
                        value={type.id.toString()}
                      >
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={editingAppliance.status || "received"}
                  onValueChange={(value: ApplianceStatus) =>
                    setEditingAppliance({
                      ...editingAppliance,
                      status: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {applianceStatusOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label className="text-sm font-medium">Labor Fee (₱)</Label>
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
                      <Select
                        value={
                          editingAppliance.labor_discount_amount
                            ? "fixed"
                            : editingAppliance.labor_discount_percentage
                              ? "percentage"
                              : "none"
                        }
                        onValueChange={(value) => {
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
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="fixed">₱</SelectItem>
                        </SelectContent>
                      </Select>
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
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header Section */}
                <div className="bg-muted/30 px-4 py-3 border-b">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Title Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-semibold">
                          {appliance.appliance_type?.name ||
                            "Unknown Appliance"}
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
                      {!disabled && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(appliance)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(appliance.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 space-y-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                </div>

                {/* Expandable Parts Section */}
                {expandedAppliances.has(appliance.id) && (
                  <div className="border-t bg-muted/10">
                    <div className="p-4">
                      <AppliancePartsManager
                        applianceId={appliance.id}
                        serviceId={serviceId}
                        disabled={!canManageParts}
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
