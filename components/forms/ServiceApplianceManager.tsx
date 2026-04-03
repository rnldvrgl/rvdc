"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MultiSelect } from "@/components/ui/multi-select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    AirconUnits,
    ApplianceStatus,
    ServiceAppliance,
    ServiceAppliancePayload,
} from "@/lib/constants/interface"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useServiceApplianceMutations } from "@/lib/mutations/services/useServiceApplianceMutations"
import { useAirconModels, useAirconUnits } from "@/lib/queries/useAircons"
import {
    useApplianceTypeChoices,
    useTechnicianChoices,
} from "@/lib/queries/useChoices"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import {
    CircleDollarSign,
    Edit,
    Package,
    Plus,
    Save,
    Shield,
    Users,
    Wrench,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { ApplianceCard } from "./service-appliance"
import {
  applianceFormSchema,
  applianceStatusOptions,
  DEFAULT_VALUES,
  type ApplianceFormValues,
} from "./service-appliance/applianceFormSchema"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ServiceApplianceManagerProps {
  serviceId: number
  serviceType?: string
  appliances: ServiceAppliance[]
  installationUnits?: AirconUnits[]
  serviceTechnicians?: number[]
  onUpdate?: () => void | Promise<void>
  disabled?: boolean
  canManageParts?: boolean
}

// ─── Component ──────────────────────────────────────────────────────────────────

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
  const { role } = useCurrentUser()
  const { data: applianceTypes = [] } = useApplianceTypeChoices()
  const { data: users = [], isLoading: usersLoading } = useTechnicianChoices()

  const isInstallation = serviceType === "installation"

  const { data: availableUnits } = useAirconUnits({
    filter: { is_available_for_sale: true },
    limit: 100,
  })

  const { data: availableModels } = useAirconModels({ limit: 100 })

  const { addAppliance, updateAppliance, deleteAppliance, toggleItemsChecked } =
    useServiceApplianceMutations()

  // ─── Form ───────────────────────────────────────────────────────────────────

  const form = useForm<ApplianceFormValues>({
    resolver: zodResolver(applianceFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const { watch, setValue, reset, handleSubmit } = form
  const unitType = watch("unit_type")
  const unitId = watch("unit_id")
  const modelId = watch("model_id")
  const laborIsFree = watch("labor_is_free")
  const laborFee = watch("labor_fee")
  const autoAdjustLabor = watch("auto_adjust_labor")
  const totalServiceFee = watch("total_service_fee")
  const brand = watch("brand")
  const model = watch("model")
  const serialNumber = watch("serial_number")
  const unitPrice = watch("unit_price")
  const applianceType = watch("appliance_type")
  const assignedTechnicians = watch("assigned_technicians")
  const issueReported = watch("issue_reported")
  const diagnosisNotes = watch("diagnosis_notes")
  const laborWarrantyMonths = watch("labor_warranty_months")
  const unitWarrantyMonths = watch("unit_warranty_months")
  const warrantyNotes = watch("warranty_notes")
  const partsNeededNotes = watch("parts_needed_notes")

  // ─── Local UI State ─────────────────────────────────────────────────────────

  const [isEditing, setIsEditing] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [expandedAppliances, setExpandedAppliances] = useState<Set<number>>(
    new Set(),
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [applianceToDelete, setApplianceToDelete] = useState<number | null>(
    null,
  )

  // ─── Auto-clear labor fee when marked free ──────────────────────────────────

  useEffect(() => {
    if (laborIsFree && laborFee !== 0) {
      setValue("labor_fee", 0)
    }
  }, [laborIsFree, laborFee, setValue])

  // ─── Auto-fill warranty months from ApplianceType defaults (new records only) ─

  useEffect(() => {
    if (!isAdding) return // only auto-fill when adding a new appliance
    if (!applianceType) return
    const typeData = applianceTypes.find((t) => t.id === applianceType)
    if (!typeData) return

    // Labor warranty: fill if still at 0 (repair services only)
    const currentLabor = form.getValues("labor_warranty_months")
    if (
      currentLabor === 0 &&
      typeData.default_labor_warranty_months > 0 &&
      serviceType === "repair"
    ) {
      setValue("labor_warranty_months", typeData.default_labor_warranty_months)
    }

    // Unit warranty: only fill for brand-new installation services
    const currentUnit = form.getValues("unit_warranty_months")
    if (
      currentUnit === 0 &&
      typeData.default_unit_warranty_months > 0 &&
      isInstallation &&
      form.getValues("unit_type") === "brand_new"
    ) {
      setValue("unit_warranty_months", typeData.default_unit_warranty_months)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applianceType])

  // ─── Merge available + assigned units for ComboBox ──────────────────────────

  const unitOptions = useMemo(() => {
    const optionMap = new Map<number, { value: string; label: string }>()

    // Add all available-for-sale units
    availableUnits?.results.forEach((unit) => {
      optionMap.set(unit.id, {
        value: unit.id.toString(),
        label: `${unit.model?.brand?.name || ""} ${unit.model?.name || ""} - SN: ${unit.serial_number}`,
      })
    })

    // Add units already assigned to this service (may no longer be available)
    installationUnits.forEach((unit) => {
      if (!optionMap.has(unit.id)) {
        optionMap.set(unit.id, {
          value: unit.id.toString(),
          label: `${unit.model?.brand?.name || ""} ${unit.model?.name || ""} - SN: ${unit.serial_number} (assigned)`,
        })
      }
    })

    return Array.from(optionMap.values())
  }, [availableUnits?.results, installationUnits])

  // Resolve selected unit details from either list
  const selectedUnit = useMemo(() => {
    if (!unitId) return null
    return (
      availableUnits?.results.find((u) => u.id === unitId) ??
      installationUnits.find((u) => u.id === unitId) ??
      null
    )
  }, [unitId, availableUnits?.results, installationUnits])

  // ─── Model options for pre-order ───────────────────────────────────────────

  const modelOptions = useMemo(() => {
    if (!availableModels?.results) return []
    return availableModels.results.map((m) => ({
      value: m.id.toString(),
      label: `${m.brand?.name || ""} ${m.name}${m.horsepower ? ` ${m.horsepower}HP` : ""}${m.aircon_type ? ` (${m.aircon_type})` : ""}`,
    }))
  }, [availableModels?.results])

  const selectedModel = useMemo(() => {
    if (!modelId || !availableModels?.results) return null
    return availableModels.results.find((m) => m.id === modelId) ?? null
  }, [modelId, availableModels?.results])

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const invalidateServiceQueries = async () => {
    await new Promise((resolve) => setTimeout(resolve, 150))
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["service"] }),
      queryClient.invalidateQueries({ queryKey: ["service-appliances"] }),
      queryClient.invalidateQueries({ queryKey: ["appliance-items"] }),
      queryClient.invalidateQueries({ queryKey: ["aircon-units"] }),
    ])
    if (onUpdate) await onUpdate()
  }

  const resetForm = () => {
    reset(DEFAULT_VALUES)
    setIsEditing(false)
    setIsAdding(false)
    setEditingId(null)
  }

  const getStatusLabel = (s: ApplianceStatus) =>
    applianceStatusOptions.find((o) => o.value === s)?.label || s

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleAdd = () => {
    reset({
      ...DEFAULT_VALUES,
      status: "pending",
      assigned_technicians: serviceTechnicians || [],
      ...(isInstallation && { unit_type: "brand_new" }),
    })
    setIsAdding(true)
    setIsEditing(true)
  }

  const handleEdit = (appliance: ServiceAppliance) => {
    let editUnitType: "brand_new" | "second_hand" | "pre_order" | undefined
    let editUnitId: number | undefined
    let editModelId: number | undefined

    if (isInstallation) {
      if (appliance.unit_type === "pre_order") {
        editUnitType = "pre_order"
        editModelId = appliance.aircon_model ?? undefined
      } else if (appliance.serial_number) {
        const matchingUnit = installationUnits.find(
          (unit) => unit.serial_number === appliance.serial_number,
        )
        if (matchingUnit) {
          editUnitId = matchingUnit.id
          editUnitType = "brand_new"
        } else {
          editUnitType = "second_hand"
        }
      } else {
        editUnitType = "second_hand"
      }
    }

    reset({
      appliance_type: appliance.appliance_type?.id ?? null,
      brand: appliance.brand || "",
      model: appliance.model || "",
      serial_number: appliance.serial_number || "",
      issue_reported: appliance.issue_reported || "",
      diagnosis_notes: appliance.diagnosis_notes || "",
      status: appliance.status,
      labor_fee: parseFloat(appliance.labor_fee) || 0,
      labor_is_free: appliance.labor_is_free,
      labor_original_amount: appliance.labor_original_amount
        ? parseFloat(appliance.labor_original_amount)
        : 0,
      labor_discount_amount: appliance.labor_discount_amount
        ? parseFloat(appliance.labor_discount_amount)
        : undefined,
      labor_discount_reason: appliance.labor_discount_reason || undefined,
      total_service_fee: appliance.total_service_fee
        ? parseFloat(appliance.total_service_fee)
        : null,
      auto_adjust_labor: appliance.auto_adjust_labor || false,
      labor_warranty_months: appliance.labor_warranty_months || 0,
      unit_warranty_months: appliance.unit_warranty_months || 0,
      warranty_notes: appliance.warranty_notes || "",
      parts_needed_notes: appliance.parts_needed_notes || "",
      unit_price: appliance.unit_price
        ? parseFloat(appliance.unit_price)
        : undefined,
      unit_type: editUnitType,
      unit_id: editUnitId,
      model_id: editModelId,
      assigned_technicians:
        serviceTechnicians && serviceTechnicians.length > 0
          ? serviceTechnicians
          : appliance.assigned_technician
            ? [appliance.assigned_technician]
            : [],
    })

    setEditingId(appliance.id)
    setIsAdding(false)
    setIsEditing(true)
  }

  const onSubmit = async (data: ApplianceFormValues) => {
    const fee = data.labor_fee || 0

    const payload: ServiceAppliancePayload = {
      service: serviceId,
      appliance_type_id: data.appliance_type ?? null,
      brand: data.brand || "",
      model: data.model || "",
      serial_number: data.serial_number || undefined,
      issue_reported: data.issue_reported || "",
      diagnosis_notes: data.diagnosis_notes || "",
      status: data.status || "pending",
      labor_fee: Math.round(fee * 100) / 100,
      labor_is_free: data.labor_is_free || false,
      labor_original_amount:
        Math.round((data.labor_original_amount || 0) * 100) / 100,
      labor_discount_amount: 0,
      labor_discount_percentage: 0,
      labor_discount_reason: "",
      total_service_fee:
        data.total_service_fee !== undefined && data.total_service_fee !== null
          ? Math.round(data.total_service_fee * 100) / 100
          : null,
      auto_adjust_labor: data.auto_adjust_labor || false,
      labor_warranty_months: data.labor_warranty_months || 0,
      unit_warranty_months: data.unit_warranty_months || 0,
      warranty_notes: data.warranty_notes || "",
      parts_needed_notes: data.parts_needed_notes || "",
      assigned_technician:
        data.assigned_technicians && data.assigned_technicians.length > 0
          ? data.assigned_technicians[0]
          : null,
      unit_price:
        data.unit_price !== undefined && data.unit_price !== null
          ? Math.round(data.unit_price * 100) / 100
          : null,
    }

    if (isInstallation && data.unit_type) {
      payload.aircon_installation_data = {
        unit_type: data.unit_type,
        unit_id: data.unit_type === "brand_new" ? data.unit_id : undefined,
        model_id: data.unit_type === "pre_order" ? data.model_id : undefined,
        unit_price:
          data.unit_price !== undefined && data.unit_price !== null
            ? Math.round(data.unit_price * 100) / 100
            : null,
      }

      if (data.unit_type === "second_hand") {
        payload.model = ""
        payload.serial_number = ""
      }
    }

    try {
      if (isAdding) {
        await addAppliance.mutateAsync(payload)
        toast.success("Appliance added successfully!")
      } else if (editingId) {
        await updateAppliance.mutateAsync({ id: editingId, data: payload })
        toast.success("Appliance updated successfully!")
      }
      resetForm()
      await invalidateServiceQueries()
    } catch {
      // Error handled by useApiMutation
    }
  }

  const handleDelete = (applianceId: number) => {
    setApplianceToDelete(applianceId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!applianceToDelete) return
    try {
      await deleteAppliance.mutateAsync({
        id: applianceToDelete,
        serviceId,
      })
      toast.success("Appliance deleted successfully!")
      setDeleteDialogOpen(false)
      setApplianceToDelete(null)
      await invalidateServiceQueries()
    } catch {
      setDeleteDialogOpen(false)
      setApplianceToDelete(null)
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedAppliances((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ─── Shared field updater ───────────────────────────────────────────────────

  const setField = (key: keyof ApplianceFormValues, value: unknown) =>
    setValue(key, value as never, { shouldValidate: true })

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4 text-muted-foreground" />
          {isInstallation ? "Units" : "Appliances"}
          {appliances.length > 0 && (
            <Badge
              variant="secondary"
              className="h-5 min-w-5 px-1.5 text-[10px] rounded-full"
            >
              {appliances.length}
            </Badge>
          )}
        </CardTitle>
        {!disabled && !isEditing && (
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add {isInstallation ? "Unit" : "Appliance"}
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            {/* Form Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                  {isAdding ? (
                    <Plus className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Edit className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <h4 className="text-sm font-semibold">
                  {isAdding
                    ? isInstallation
                      ? "Add Unit"
                      : "Add Appliance"
                    : isInstallation
                      ? "Edit Unit"
                      : "Edit Appliance"}
                </h4>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmit(
                    onSubmit as Parameters<typeof handleSubmit>[0],
                  )}
                  variant="success"
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {isAdding ? "Add" : "Save Changes"}
                </Button>
              </div>
            </div>

            {/* ── Section 1: Assignment ──────────────────────────────── */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Assignment
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!isInstallation && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Appliance Type
                    </Label>
                    <ComboBox
                      options={[{ value: "none", label: "N/A" }].concat(
                        applianceTypes.map((t) => ({
                          value: t.id.toString(),
                          label: t.name,
                        })),
                      )}
                      value={applianceType ? applianceType.toString() : "none"}
                      onChange={(v) =>
                        setField(
                          "appliance_type",
                          v === "none" ? null : Number(v),
                        )
                      }
                      placeholder="Select type"
                      searchPlaceholder="Search appliance types..."
                    />
                  </div>
                )}
                <div
                  className={`space-y-2 ${isInstallation ? "col-span-2" : ""}`}
                >
                  <Label className="text-sm font-medium">
                    Assigned Technicians
                  </Label>
                  <MultiSelect
                    options={users.map((tech) => ({
                      value: tech.id.toString(),
                      label: tech.full_name,
                    }))}
                    selected={
                      assignedTechnicians
                        ?.filter((id) => id !== undefined && id !== null)
                        .map((id) => id.toString()) ?? []
                    }
                    onChange={(values: string[]) =>
                      setField(
                        "assigned_technicians",
                        values.map((v) => Number(v)),
                      )
                    }
                    placeholder="Select technicians (optional)"
                    disabled={usersLoading}
                  />
                </div>
              </div>
            </div>

            {/* ── Section 2: Unit Details (Installation) ─────────────── */}
            {isInstallation && (
              <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Unit Details
                  </span>
                </div>

                {/* Unit Type Selector */}
                <RadioGroup
                  value={unitType || "brand_new"}
                  onValueChange={(
                    v: "brand_new" | "second_hand" | "pre_order",
                  ) => {
                    setField("unit_type", v)
                    setField("unit_id", undefined)
                    setField("model_id", undefined)
                    setField("brand", "")
                    setField("model", "")
                    setField("serial_number", "")
                  }}
                  className="grid grid-cols-3 gap-3"
                >
                  <label
                    htmlFor="brand_new"
                    className={`relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${unitType === "brand_new" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/50"}`}
                  >
                    <RadioGroupItem
                      value="brand_new"
                      id="brand_new"
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium">Brand New</div>
                      <div className="text-xs text-muted-foreground">
                        Select from inventory
                      </div>
                    </div>
                  </label>
                  <label
                    htmlFor="second_hand"
                    className={`relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${unitType === "second_hand" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/50"}`}
                  >
                    <RadioGroupItem
                      value="second_hand"
                      id="second_hand"
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium">Second Hand</div>
                      <div className="text-xs text-muted-foreground">
                        Enter brand and optional price
                      </div>
                    </div>
                  </label>
                  <label
                    htmlFor="pre_order"
                    className={`relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${unitType === "pre_order" ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/20" : "hover:bg-muted/50"}`}
                  >
                    <RadioGroupItem
                      value="pre_order"
                      id="pre_order"
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-medium">Pre-Order</div>
                      <div className="text-xs text-muted-foreground">
                        Unit not in stock yet
                      </div>
                    </div>
                  </label>
                </RadioGroup>

                {/* Brand New — Unit Selector */}
                {unitType === "brand_new" && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Select Aircon Unit
                    </Label>
                    <ComboBox
                      value={unitId?.toString() || null}
                      onChange={(value) => {
                        const id = value ? Number(value) : undefined
                        const unit =
                          availableUnits?.results.find((u) => u.id === id) ??
                          installationUnits.find((u) => u.id === id)
                        setField("unit_id", id)
                        setField("unit_type", "brand_new")
                        setField("brand", unit?.model?.brand?.name || "")
                        setField("model", unit?.model?.name || "")
                        setField("serial_number", unit?.serial_number || "")
                        setField("unit_price", undefined)
                      }}
                      options={unitOptions}
                      placeholder="Select unit from inventory"
                      searchPlaceholder="Search units..."
                    />
                  </div>
                )}

                {/* Brand New — Selected unit details */}
                {unitType === "brand_new" && selectedUnit && (
                  <div className="rounded-lg border bg-background p-4 space-y-3">
                    <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Selected Unit
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Brand</p>
                        <p className="font-medium">
                          {selectedUnit.model?.brand?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Model</p>
                        <p className="font-medium">
                          {selectedUnit.model?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Serial Number
                        </p>
                        <p className="font-medium">
                          {selectedUnit.serial_number || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="font-medium">
                          {selectedUnit.model?.aircon_type || "N/A"}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-end justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          {selectedUnit.model?.has_discount ? (
                            <>
                              <span className="text-lg font-bold text-primary">
                                ₱
                                {parseFloat(
                                  selectedUnit.model.selling_price || "0",
                                ).toLocaleString("en-PH", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              <span className="text-sm line-through text-muted-foreground">
                                ₱
                                {parseFloat(
                                  selectedUnit.model.retail_price || "0",
                                ).toLocaleString("en-PH", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-primary">
                              {selectedUnit.model?.retail_price
                                ? `₱${parseFloat(selectedUnit.model.retail_price).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : "N/A"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedUnit.model?.has_discount
                            ? "Selling price"
                            : "Retail price"}
                        </p>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs font-medium">
                          Price Override
                          <span className="text-muted-foreground ml-1">
                            (optional)
                          </span>
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={unitPrice ?? ""}
                          onChange={(e) =>
                            setField(
                              "unit_price",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          placeholder={`₱${parseFloat(selectedUnit.model?.selling_price || selectedUnit.model?.retail_price || "0").toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Second Hand — Manual Entry */}
                {unitType === "second_hand" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Brand</Label>
                      <Input
                        value={brand || ""}
                        onChange={(e) => setField("brand", e.target.value)}
                        placeholder="e.g., Samsung, LG, Carrier"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Unit Price{" "}
                        <span className="text-muted-foreground text-xs">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={unitPrice ?? ""}
                        onChange={(e) =>
                          setField(
                            "unit_price",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                        placeholder="₱0.00 — leave blank for labor-only"
                      />
                    </div>
                  </div>
                )}

                {/* Pre-Order — Model Selector */}
                {unitType === "pre_order" && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Select Aircon Model
                    </Label>
                    <ComboBox
                      value={modelId?.toString() || null}
                      onChange={(value) => {
                        const id = value ? Number(value) : undefined
                        const mdl = availableModels?.results.find(
                          (m) => m.id === id,
                        )
                        setField("model_id", id)
                        setField("brand", mdl?.brand?.name || "")
                        setField("model", mdl?.name || "")
                        setField("unit_price", undefined)
                      }}
                      options={modelOptions}
                      placeholder="Select model to pre-order"
                      searchPlaceholder="Search models..."
                    />
                  </div>
                )}

                {/* Pre-Order — Selected model details */}
                {unitType === "pre_order" && selectedModel && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
                    <h4 className="text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      Pre-Order Model
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Brand</p>
                        <p className="font-medium">
                          {selectedModel.brand?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Model</p>
                        <p className="font-medium">
                          {selectedModel.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="font-medium">
                          {selectedModel.aircon_type || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">HP</p>
                        <p className="font-medium">
                          {selectedModel.horsepower || "N/A"}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-end justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          {selectedModel.has_discount ? (
                            <>
                              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                ₱
                                {parseFloat(
                                  selectedModel.selling_price || "0",
                                ).toLocaleString("en-PH", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              <span className="text-sm line-through text-muted-foreground">
                                ₱
                                {parseFloat(
                                  selectedModel.retail_price || "0",
                                ).toLocaleString("en-PH", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                              {selectedModel.retail_price
                                ? `₱${parseFloat(selectedModel.retail_price).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : "N/A"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedModel.has_discount
                            ? "Selling price"
                            : "Retail price"}
                        </p>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs font-medium">
                          Price Override
                          <span className="text-muted-foreground ml-1">
                            (optional)
                          </span>
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={unitPrice ?? ""}
                          onChange={(e) =>
                            setField(
                              "unit_price",
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          placeholder={`₱${parseFloat(selectedModel.selling_price || selectedModel.retail_price || "0").toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Section 2b: Unit Information (Non-installation) ────── */}
            {!isInstallation && (
              <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Wrench className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Unit Information
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Brand</Label>
                    <Input
                      value={brand || ""}
                      onChange={(e) => setField("brand", e.target.value)}
                      placeholder="e.g., Samsung, LG"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Model</Label>
                    <Input
                      value={model || ""}
                      onChange={(e) => setField("model", e.target.value)}
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
                      value={serialNumber || ""}
                      onChange={(e) =>
                        setField("serial_number", e.target.value)
                      }
                      placeholder="Serial number of appliance"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Section 3: Labor & Pricing ─────────────────────────── */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CircleDollarSign className="h-3.5 w-3.5" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Labor & Pricing
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {isInstallation ? "Installation Fee (₱)" : "Labor Fee (₱)"}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={laborFee || 0}
                    onChange={(e) =>
                      setField("labor_fee", parseFloat(e.target.value) || 0)
                    }
                    disabled={autoAdjustLabor}
                  />
                  {autoAdjustLabor && (
                    <p className="text-xs text-muted-foreground">
                      Auto-computed: Total Fee − Parts Cost
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="labor_is_free"
                    checked={laborIsFree || false}
                    onCheckedChange={(checked) =>
                      setField("labor_is_free", checked === true)
                    }
                    className="cursor-pointer"
                  />
                  <Label
                    htmlFor="labor_is_free"
                    className="text-sm font-medium cursor-pointer"
                  >
                    {isInstallation ? "Installation" : "Labor"} is Free
                  </Label>
                </div>
              </div>

              {/* Auto-adjust Labor */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto_adjust_labor"
                    checked={autoAdjustLabor || false}
                    onCheckedChange={(checked) => {
                      const enabled = checked === true
                      setField("auto_adjust_labor", enabled)
                      if (enabled && !totalServiceFee) {
                        setField("total_service_fee", laborFee || 0)
                      }
                    }}
                    className="cursor-pointer"
                  />
                  <Label
                    htmlFor="auto_adjust_labor"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Auto-adjust labor fee (total includes parts)
                  </Label>
                </div>
                {autoAdjustLabor && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Total Service Fee (₱)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={totalServiceFee ?? 0}
                      onChange={(e) =>
                        setField(
                          "total_service_fee",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="Total quoted to client (labor + parts)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Labor fee will auto-adjust as parts are added/removed so
                      that Labor + Parts = Total Service Fee.
                    </p>
                  </div>
                )}
              </div>


            </div>

            {/* ── Section 4: Service Details (non-installation only) ──── */}
            {!isInstallation && (
              <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Wrench className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Service Details
                  </span>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Issue Reported</Label>
                  <Textarea
                    value={issueReported || ""}
                    onChange={(e) => setField("issue_reported", e.target.value)}
                    placeholder="Describe the issue reported by the client"
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Diagnosis Notes</Label>
                  <Textarea
                    value={diagnosisNotes || ""}
                    onChange={(e) =>
                      setField("diagnosis_notes", e.target.value)
                    }
                    placeholder="Technician's diagnosis and findings"
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-orange-500" />
                    Parts Needed
                  </Label>
                  <Textarea
                    value={partsNeededNotes || ""}
                    onChange={(e) =>
                      setField("parts_needed_notes", e.target.value)
                    }
                    placeholder="List parts the technician reported are needed (for clerk reference)"
                    rows={2}
                    className="resize-none border-orange-200 focus-visible:ring-orange-300"
                  />
                </div>
              </div>
            )}

            {/* ── Section 5: Labor Warranty (repair only) ─────────── */}
            {serviceType === "repair" && (
              <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Warranty
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Labor Warranty (months)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={laborWarrantyMonths || 0}
                      onChange={(e) =>
                        setField(
                          "labor_warranty_months",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      placeholder="0 for no warranty"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Warranty Notes
                      <span className="text-muted-foreground text-xs ml-1">
                        (e.g., compressor warranty, parts coverage)
                      </span>
                    </Label>
                    <Textarea
                      value={warrantyNotes || ""}
                      onChange={(e) =>
                        setField("warranty_notes", e.target.value)
                      }
                      placeholder="Additional warranty details..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : appliances.length > 0 ? (
          <div className="space-y-3">
            {appliances.map((appliance) => (
              <ApplianceCard
                key={appliance.id}
                appliance={appliance}
                serviceId={serviceId}
                isInstallation={isInstallation}
                installationUnits={installationUnits}
                serviceTechnicians={serviceTechnicians}
                users={users}
                disabled={disabled}
                canManageParts={canManageParts}
                expanded={expandedAppliances.has(appliance.id)}
                onToggleExpand={() => toggleExpand(appliance.id)}
                onEdit={() => handleEdit(appliance)}
                onDelete={() => handleDelete(appliance.id)}
                onUpdate={onUpdate}
                getStatusLabel={getStatusLabel}
                updateAppliance={updateAppliance}
                toggleItemsChecked={toggleItemsChecked}
                canConfirmItems={role === "clerk" || role === "admin"}
                invalidateServiceQueries={invalidateServiceQueries}
              />
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
        variant="destructive"
      />
    </Card>
  )
}
