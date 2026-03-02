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
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Edit,
  Package,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

// ─── Types & Constants ──────────────────────────────────────────────────────────

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

const applianceStatusOptions: { value: ApplianceStatus; label: string }[] = [
  { value: "received", label: "Received" },
  { value: "diagnosed", label: "Diagnosed" },
  { value: "in_repair", label: "In Repair" },
  { value: "completed", label: "Completed" },
  { value: "ready_for_pickup", label: "Ready for Pickup" },
  { value: "delivered", label: "Delivered" },
  { value: "reserved", label: "Reserved" },
  { value: "installed", label: "Installed" },
]

// ─── Zod Schema ─────────────────────────────────────────────────────────────────

const applianceFormSchema = z.object({
  appliance_type: z.number().nullable(),
  brand: z.string(),
  model: z.string(),
  serial_number: z.string(),
  issue_reported: z.string(),
  diagnosis_notes: z.string(),
  status: z.enum([
    "received",
    "diagnosed",
    "in_repair",
    "completed",
    "ready_for_pickup",
    "delivered",
    "reserved",
    "installed",
  ]),
  labor_fee: z.coerce.number().min(0, "Labor fee must be non-negative"),
  labor_is_free: z.boolean(),
  labor_original_amount: z.coerce.number().min(0),
  labor_discount_amount: z.coerce.number().min(0).optional(),
  labor_discount_percentage: z.coerce
    .number()
    .min(0)
    .max(100, "Percentage cannot exceed 100")
    .optional(),
  labor_discount_reason: z.string().optional(),
  unit_price: z.coerce.number().min(0).nullable().optional(),
  labor_warranty_months: z.coerce.number().min(0),
  unit_warranty_months: z.coerce.number().min(0),
  warranty_notes: z.string(),
  assigned_technicians: z.array(z.number()),
  unit_type: z.enum(["brand_new", "second_hand"]).optional(),
  unit_id: z.number().optional(),
})

type ApplianceFormValues = z.infer<typeof applianceFormSchema>

const DEFAULT_VALUES: ApplianceFormValues = {
  appliance_type: null,
  brand: "",
  model: "",
  serial_number: "",
  issue_reported: "",
  diagnosis_notes: "",
  status: "received",
  labor_fee: 0,
  labor_is_free: false,
  labor_original_amount: 0,
  labor_warranty_months: 0,
  unit_warranty_months: 0,
  warranty_notes: "",
  assigned_technicians: [],
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
  const { data: applianceTypes = [] } = useApplianceTypeChoices()
  const { data: users = [], isLoading: usersLoading } = useTechnicianChoices()

  const isInstallation = serviceType === "installation"

  const { data: availableUnits } = useAirconUnits({
    filter: { is_available_for_sale: true },
    limit: 100,
  })

  const { addAppliance, updateAppliance, deleteAppliance } =
    useServiceApplianceMutations()

  // ─── Form ───────────────────────────────────────────────────────────────────

  const form = useForm<ApplianceFormValues>({
    resolver: zodResolver(applianceFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const { watch, setValue, reset, handleSubmit } = form
  const unitType = watch("unit_type")
  const unitId = watch("unit_id")
  const laborIsFree = watch("labor_is_free")
  const laborFee = watch("labor_fee")
  const laborDiscountAmount = watch("labor_discount_amount")
  const laborDiscountPercentage = watch("labor_discount_percentage")
  const brand = watch("brand")
  const model = watch("model")
  const serialNumber = watch("serial_number")
  const unitPrice = watch("unit_price")
  const applianceType = watch("appliance_type")
  const assignedTechnicians = watch("assigned_technicians")
  const laborDiscountReason = watch("labor_discount_reason")
  const issueReported = watch("issue_reported")
  const diagnosisNotes = watch("diagnosis_notes")
  const laborWarrantyMonths = watch("labor_warranty_months")
  const unitWarrantyMonths = watch("unit_warranty_months")
  const warrantyNotes = watch("warranty_notes")

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
  const [showLaborDiscount, setShowLaborDiscount] = useState(false)

  // ─── Auto-clear labor fee when marked free ──────────────────────────────────

  useEffect(() => {
    if (laborIsFree && laborFee !== 0) {
      setValue("labor_fee", 0)
    }
  }, [laborIsFree, laborFee, setValue])

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
    setShowLaborDiscount(false)
  }

  const getStatusLabel = (s: ApplianceStatus) =>
    applianceStatusOptions.find((o) => o.value === s)?.label || s

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleAdd = () => {
    reset({
      ...DEFAULT_VALUES,
      status: isInstallation ? "reserved" : "received",
      assigned_technicians: serviceTechnicians || [],
      ...(isInstallation && { unit_type: "brand_new" }),
    })
    setIsAdding(true)
    setIsEditing(true)
  }

  const handleEdit = (appliance: ServiceAppliance) => {
    let editUnitType: "brand_new" | "second_hand" | undefined
    let editUnitId: number | undefined

    if (isInstallation && appliance.serial_number) {
      const matchingUnit = installationUnits.find(
        (unit) => unit.serial_number === appliance.serial_number,
      )
      if (matchingUnit) {
        editUnitId = matchingUnit.id
        editUnitType = appliance.unit_price ? "second_hand" : "brand_new"
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
      labor_discount_percentage: appliance.labor_discount_percentage
        ? parseFloat(appliance.labor_discount_percentage)
        : undefined,
      labor_discount_reason: appliance.labor_discount_reason || undefined,
      labor_warranty_months: appliance.labor_warranty_months || 0,
      unit_warranty_months: appliance.unit_warranty_months || 0,
      warranty_notes: appliance.warranty_notes || "",
      unit_price: appliance.unit_price
        ? parseFloat(appliance.unit_price)
        : undefined,
      unit_type: editUnitType,
      unit_id: editUnitId,
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

    if (
      (appliance.labor_discount_amount &&
        parseFloat(appliance.labor_discount_amount) > 0) ||
      (appliance.labor_discount_percentage &&
        parseFloat(appliance.labor_discount_percentage) > 0)
    ) {
      setShowLaborDiscount(true)
    }
  }

  const onSubmit = async (data: ApplianceFormValues) => {
    const fee = data.labor_fee || 0
    const discAmt = data.labor_discount_amount || 0
    const discPct = data.labor_discount_percentage || 0

    if (discAmt > 0 && discAmt > fee) {
      toast.error(
        `Labor discount (₱${discAmt.toFixed(2)}) cannot exceed labor fee (₱${fee.toFixed(2)})`,
      )
      return
    }
    if (discPct > 0) {
      const calculated = (fee * discPct) / 100
      if (calculated > fee) {
        toast.error(
          `Labor discount (${discPct}% = ₱${calculated.toFixed(2)}) cannot exceed labor fee (₱${fee.toFixed(2)})`,
        )
        return
      }
    }

    const hasDiscount =
      (discAmt !== undefined && discAmt > 0) ||
      (discPct !== undefined && discPct > 0)

    const payload: ServiceAppliancePayload = {
      service: serviceId,
      appliance_type_id: data.appliance_type ?? null,
      brand: data.brand || "",
      model: data.model || "",
      serial_number: data.serial_number || undefined,
      issue_reported: data.issue_reported || "",
      diagnosis_notes: data.diagnosis_notes || "",
      status: data.status || (isInstallation ? "reserved" : "received"),
      labor_fee: Math.round(fee * 100) / 100,
      labor_is_free: data.labor_is_free || false,
      labor_original_amount:
        Math.round((data.labor_original_amount || 0) * 100) / 100,
      labor_discount_amount: discAmt > 0 ? Math.round(discAmt * 100) / 100 : 0,
      labor_discount_percentage:
        discPct > 0 ? Math.round(discPct * 100) / 100 : 0,
      labor_discount_reason: hasDiscount
        ? data.labor_discount_reason || ""
        : "",
      labor_warranty_months: data.labor_warranty_months || 0,
      unit_warranty_months: data.unit_warranty_months || 0,
      warranty_notes: data.warranty_notes || "",
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
        unit_price:
          data.unit_type === "second_hand" &&
          data.unit_price !== undefined &&
          data.unit_price !== null
            ? Math.round(data.unit_price * 100) / 100
            : null,
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
        <CardTitle className="flex items-center text-lg">
          {isInstallation ? "Units" : "Appliances"}
          <Badge
            variant="secondary"
            className="ml-2"
          >
            {appliances.length}
          </Badge>
        </CardTitle>
        {!disabled && !isEditing && (
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
        {isEditing ? (
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
              {/* Appliance Type (non-installation only) */}
              {!isInstallation && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Appliance Type</Label>
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

              {/* Assigned Technicians */}
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

              {/* ── Installation Fields ──────────────────────────────────── */}
              {isInstallation && (
                <>
                  {/* Unit Type Selector */}
                  <div className="space-y-3 pt-3 border-t col-span-2">
                    <Label className="text-sm font-medium">Unit Type</Label>
                    <RadioGroup
                      value={unitType || "brand_new"}
                      onValueChange={(v: "brand_new" | "second_hand") => {
                        setField("unit_type", v)
                        setField("unit_id", undefined)
                        setField("brand", "")
                        setField("model", "")
                        setField("serial_number", "")
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

                  {/* Brand New — Unit Selector */}
                  {unitType === "brand_new" && (
                    <div className="space-y-3 col-span-2">
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
                        }}
                        options={unitOptions}
                        placeholder="Select unit from inventory"
                        searchPlaceholder="Search units..."
                      />
                    </div>
                  )}

                  {/* Brand New — Selected unit details */}
                  {unitType === "brand_new" && selectedUnit && (
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
                          <p className="text-muted-foreground">Serial Number</p>
                          <p className="font-medium">
                            {selectedUnit.serial_number || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-medium">
                            {selectedUnit.model?.aircon_type || "N/A"}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Retail Price</p>
                          <p className="text-lg font-bold text-primary">
                            {selectedUnit.model?.retail_price
                              ? `₱${parseFloat(selectedUnit.model.retail_price).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Second Hand — Manual Entry */}
                  {unitType === "second_hand" && (
                    <>
                      <div className="space-y-2 col-span-2">
                        <Label className="text-sm font-medium">Brand</Label>
                        <Input
                          value={brand || ""}
                          onChange={(e) => setField("brand", e.target.value)}
                          placeholder="e.g., Samsung, LG, Carrier"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
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
                          placeholder="Serial number of unit"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label className="text-sm font-medium">
                          Unit Price{" "}
                          <span className="text-muted-foreground text-xs">
                            (optional — leave empty if labor only)
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
                    </>
                  )}

                  <Separator className="col-span-2" />
                </>
              )}

              {/* ── Non-installation brand/model/serial ──────────────────── */}
              {!isInstallation && (
                <>
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
                  <div className="space-y-2">
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
                </>
              )}

              {/* ── Labor Fee ────────────────────────────────────────────── */}
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
                />
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

              {/* ── Labor Discount ───────────────────────────────────────── */}
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
                          laborDiscountAmount !== undefined
                            ? "fixed"
                            : laborDiscountPercentage !== undefined
                              ? "percentage"
                              : "none"
                        }
                        onChange={(v) => {
                          if (v === "none") {
                            setField("labor_discount_amount", undefined)
                            setField("labor_discount_percentage", undefined)
                            setField("labor_discount_reason", undefined)
                          } else if (v === "fixed") {
                            setField("labor_discount_amount", 0)
                            setField("labor_discount_percentage", undefined)
                          } else {
                            setField("labor_discount_amount", undefined)
                            setField("labor_discount_percentage", 0)
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
                          laborDiscountAmount ?? laborDiscountPercentage ?? ""
                        }
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          if (laborDiscountAmount !== undefined) {
                            setField("labor_discount_amount", val)
                          } else if (laborDiscountPercentage !== undefined) {
                            setField("labor_discount_percentage", val)
                          }
                        }}
                        disabled={
                          laborDiscountAmount === undefined &&
                          laborDiscountPercentage === undefined
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Reason</Label>
                      <Input
                        placeholder="Optional"
                        value={laborDiscountReason || ""}
                        onChange={(e) =>
                          setField("labor_discount_reason", e.target.value)
                        }
                        disabled={
                          laborDiscountAmount === undefined &&
                          laborDiscountPercentage === undefined
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Issue / Diagnosis (non-installation only) */}
            {!isInstallation && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Issue Reported</Label>
                  <Textarea
                    value={issueReported || ""}
                    onChange={(e) => setField("issue_reported", e.target.value)}
                    placeholder="Describe the issue reported by the client"
                    rows={2}
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
                  />
                </div>
              </>
            )}

            {/* Warranty (non-installation only) */}
            {!isInstallation && (
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
                      Unit Warranty (months)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={unitWarrantyMonths || 0}
                      onChange={(e) =>
                        setField(
                          "unit_warranty_months",
                          parseInt(e.target.value) || 0,
                        )
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

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={resetForm}
              >
                <X className="mr-2 h-4 w-4" />
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
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
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
      />
    </Card>
  )
}

// ─── Appliance Display Card (extracted to reduce main component size) ─────────

// ─── Status flow definitions ─────────────────────────────────────────────────

const INSTALLATION_STATUS_FLOW: {
  from: ApplianceStatus
  to: ApplianceStatus
  label: string
  icon: typeof CheckCircle
  variant: "success" | "outline" | "secondary" | "destructive"
}[] = [
  {
    from: "reserved",
    to: "installed",
    label: "Mark as Installed",
    icon: CheckCircle,
    variant: "success",
  },
  {
    from: "installed",
    to: "reserved",
    label: "Return to Reserved",
    icon: RotateCcw,
    variant: "outline",
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
    from: "received",
    to: "diagnosed",
    label: "Mark Diagnosed",
    icon: ArrowRight,
    variant: "outline",
  },
  {
    from: "diagnosed",
    to: "in_repair",
    label: "Start Repair",
    icon: ArrowRight,
    variant: "outline",
  },
  {
    from: "in_repair",
    to: "completed",
    label: "Mark Completed",
    icon: CheckCircle,
    variant: "success",
  },
  {
    from: "completed",
    to: "ready_for_pickup",
    label: "Ready for Pickup",
    icon: ArrowRight,
    variant: "outline",
  },
  {
    from: "ready_for_pickup",
    to: "delivered",
    label: "Mark Delivered",
    icon: CheckCircle,
    variant: "success",
  },
  // Reverse actions
  {
    from: "diagnosed",
    to: "received",
    label: "Back to Received",
    icon: RotateCcw,
    variant: "secondary",
  },
  {
    from: "in_repair",
    to: "diagnosed",
    label: "Back to Diagnosed",
    icon: RotateCcw,
    variant: "secondary",
  },
  {
    from: "completed",
    to: "in_repair",
    label: "Re-open Repair",
    icon: RotateCcw,
    variant: "secondary",
  },
  {
    from: "ready_for_pickup",
    to: "completed",
    label: "Back to Completed",
    icon: RotateCcw,
    variant: "secondary",
  },
  {
    from: "delivered",
    to: "ready_for_pickup",
    label: "Unmark Delivered",
    icon: RotateCcw,
    variant: "secondary",
  },
]

interface ApplianceCardProps {
  appliance: ServiceAppliance
  serviceId: number
  isInstallation: boolean
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
  invalidateServiceQueries: () => Promise<void>
}

function ApplianceCard({
  appliance,
  serviceId,
  isInstallation,
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
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="border-b flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
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

          {(appliance.brand || appliance.model) && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Package className="h-3.5 w-3.5" />
              <span className="font-medium">{appliance.brand || "—"}</span>
              {appliance.model && (
                <>
                  <span>•</span>
                  <span>{appliance.model}</span>
                </>
              )}
            </p>
          )}

          {serviceTechnicians.length > 0 && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              <span>Assigned to:</span>
              <span className="font-medium">
                {serviceTechnicians
                  .map(
                    (techId) => users.find((u) => u.id === techId)?.full_name,
                  )
                  .filter(Boolean)
                  .join(", ") || "—"}
              </span>
            </p>
          )}

          {/* Quick Status Actions */}
          {!disabled && availableActions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
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
                    className="h-7 text-xs"
                  >
                    <Icon className="mr-1 h-3.5 w-3.5" />
                    {action.label}
                  </Button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="h-8 w-8 p-0"
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
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
          {!disabled && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
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

      {/* Content */}
      <CardContent className="space-y-4">
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
          {/* Labor Fee */}
          <Card className="border-2">
            <CardContent>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Labor Fee
                </Label>
                {appliance.labor_is_free ? (
                  <Badge
                    variant="success"
                    className="ml-2"
                  >
                    FREE
                  </Badge>
                ) : (
                  <div className="space-y-1">
                    {((appliance.labor_discount_amount &&
                      parseFloat(appliance.labor_discount_amount) > 0) ||
                      (appliance.labor_discount_percentage &&
                        parseFloat(appliance.labor_discount_percentage) >
                          0)) && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm line-through text-muted-foreground">
                          {formatCurrency(parseFloat(appliance.labor_fee))}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-600"
                        >
                          {appliance.labor_discount_percentage &&
                          parseFloat(appliance.labor_discount_percentage) > 0
                            ? `${appliance.labor_discount_percentage}% off`
                            : `₱${appliance.labor_discount_amount} off`}
                        </Badge>
                      </div>
                    )}
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(
                        parseFloat(
                          appliance.discounted_labor_fee || appliance.labor_fee,
                        ),
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Unit Price (installation only) */}
          {isInstallation && (
            <UnitPriceCard
              appliance={appliance}
              installationUnits={installationUnits}
            />
          )}

          {/* Parts Cost */}
          <Card className="border-2">
            <CardContent>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Parts Cost
                </Label>
                {appliance.items_used && appliance.items_used.length > 0 ? (
                  <div className="space-y-1">
                    {(() => {
                      const totalOriginal = appliance.items_used.reduce(
                        (sum, part) =>
                          sum + parseFloat(part.item_price) * part.quantity,
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
                                {formatCurrency(totalOriginal - totalFinal)} off
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
                      {appliance.items_used.length === 1 ? "item" : "items"}{" "}
                      used
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No parts used</p>
                )}
              </div>
            </CardContent>
          </Card>
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
      </CardContent>

      {/* Expandable Parts Manager */}
      {expanded && (
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
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function UnitPriceCard({
  appliance,
  installationUnits,
}: {
  appliance: ServiceAppliance
  installationUnits: AirconUnits[]
}) {
  const matchingUnit = appliance.serial_number
    ? installationUnits.find(
        (unit) => unit.serial_number === appliance.serial_number,
      )
    : null

  const price = matchingUnit?.model
    ? parseFloat(matchingUnit.model.promo_price || "0")
    : appliance.unit_price
      ? parseFloat(appliance.unit_price)
      : null

  return (
    <Card className="border-2">
      <CardContent>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Unit Price
          </Label>
          {price != null && price > 0 ? (
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(price)}
              </p>
              <p className="text-xs text-muted-foreground">
                {matchingUnit?.model
                  ? `${matchingUnit.model.brand?.name} ${matchingUnit.model.name}`
                  : "Second-hand unit"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {matchingUnit ? "No unit linked" : "Labor only (no unit price)"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function WarrantyCard({ appliance }: { appliance: ServiceAppliance }) {
  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent>
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300">
            Warranty Information
          </Label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {appliance.labor_warranty_months != null &&
              appliance.labor_warranty_months > 0 && (
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

            {appliance.unit_warranty_months != null &&
              appliance.unit_warranty_months > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Unit Warranty</p>
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
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="text-sm leading-relaxed">
                {appliance.warranty_notes}
              </p>
            </div>
          )}

          {appliance.warranty_start_date && (
            <p className="text-xs text-muted-foreground pt-1">
              Warranty started:{" "}
              {new Date(appliance.warranty_start_date).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PartsSummary({
  parts = [],
}: {
  parts?: ServiceAppliance["items_used"]
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        Parts Summary
      </Label>
      <div className="bg-muted/30 rounded-md p-3">
        <div className="space-y-1.5">
          {parts.map((part) => {
            const hasDiscount =
              (part.discount_amount && parseFloat(part.discount_amount) > 0) ||
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
                    <span className="text-xs">(x{part.quantity})</span>
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
                        parseFloat(part.item_price) * part.quantity,
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
  )
}
