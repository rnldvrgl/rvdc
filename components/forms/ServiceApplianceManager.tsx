"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import AppliancePartsManager from "@/components/forms/AppliancePartsManager"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  ApplianceStatus,
  ServiceAppliance,
  ServiceAppliancePayload,
} from "@/lib/constants/interface"
import { useServiceApplianceMutations } from "@/lib/mutations/services/useServiceApplianceMutations"
import { useApplianceTypeChoices } from "@/lib/queries/useChoices"
import { formatCurrency } from "@/lib/utils/helpers"
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ServiceApplianceManagerProps {
  serviceId: number
  appliances: ServiceAppliance[]
  onUpdate?: () => void
  disabled?: boolean
}

interface EditingAppliance extends Partial<ServiceAppliancePayload> {
  tempId?: string
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
  onUpdate,
  disabled = false,
}: ServiceApplianceManagerProps) {
  const { data: applianceTypes = [] } = useApplianceTypeChoices()
  const { addAppliance, updateAppliance, deleteAppliance } =
    useServiceApplianceMutations()
  const [editingAppliance, setEditingAppliance] =
    useState<EditingAppliance | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [expandedAppliances, setExpandedAppliances] = useState<Set<number>>(
    new Set(),
  )

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
    if (confirm("Are you sure you want to delete this appliance?")) {
      deleteAppliance.mutate(
        { id: applianceId, serviceId },
        {
          onSuccess: () => {
            toast.success("Appliance deleted successfully!")
            onUpdate?.()
          },
          onError: () => {
            toast.error("Failed to delete appliance")
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
            variant="outline"
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
                <label className="text-sm font-medium">Appliance Type</label>
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
                <label className="text-sm font-medium">Status</label>
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Brand</label>
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
                <label className="text-sm font-medium">Model</label>
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
                <label className="text-sm font-medium">Labor Fee (₱)</label>
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
                <input
                  type="checkbox"
                  id="labor_is_free"
                  checked={editingAppliance.labor_is_free || false}
                  onChange={(e) =>
                    setEditingAppliance({
                      ...editingAppliance,
                      labor_is_free: e.target.checked,
                    })
                  }
                  className="h-4 w-4"
                />
                <label
                  htmlFor="labor_is_free"
                  className="text-sm font-medium"
                >
                  Labor is Free
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Issue Reported</label>
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
              <label className="text-sm font-medium">Diagnosis Notes</label>
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
                variant="outline"
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
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        ) : appliances.length > 0 ? (
          <div className="space-y-3">
            {appliances.map((appliance) => (
              <div
                key={appliance.id}
                className="rounded-md border space-y-0"
              >
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">
                          {appliance.appliance_type?.name || "N/A"}
                        </p>
                        <Badge variant="outline">
                          {getStatusLabel(appliance.status)}
                        </Badge>
                      </div>
                      {(appliance.brand || appliance.model) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {appliance.brand || "—"}
                          {appliance.model && ` • ${appliance.model}`}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(appliance.id)}
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
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(appliance.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {appliance.issue_reported && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Issue
                      </p>
                      <p className="text-sm">{appliance.issue_reported}</p>
                    </div>
                  )}
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      Labor Fee
                    </p>
                    {appliance.labor_is_free ? (
                      <Badge variant="success">FREE</Badge>
                    ) : (
                      <span className="text-sm font-medium">
                        {formatCurrency(parseFloat(appliance.labor_fee))}
                      </span>
                    )}
                  </div>

                  {appliance.items_used && appliance.items_used.length > 0 && (
                    <>
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-muted-foreground">
                          Parts ({appliance.items_used.length} items)
                        </span>
                        <span>
                          {formatCurrency(
                            parseFloat(appliance.total_parts_cost || "0"),
                          )}
                        </span>
                      </div>
                      {/* Show parts details */}
                      <div className="ml-4 mt-1 space-y-1 text-xs">
                        {appliance.items_used.map((part) => (
                          <div
                            key={part.id}
                            className="flex justify-between text-muted-foreground"
                          >
                            <span>
                              • {part.item_name} (x{part.quantity})
                            </span>
                            <span>{formatCurrency(part.line_total)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Expandable Parts Section */}
                {expandedAppliances.has(appliance.id) && (
                  <div className="p-4 border-t bg-muted/30">
                    <AppliancePartsManager
                      applianceId={appliance.id}
                      serviceId={serviceId}
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>
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
    </Card>
  )
}
