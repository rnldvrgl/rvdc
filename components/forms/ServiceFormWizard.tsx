"use client"

import { CardSelect } from "@/components/custom/inputs/CardSelect"
import {
  ClientCardSelect,
  useClients,
} from "@/components/custom/inputs/ClientComboBox"
import { DateTimePicker } from "@/components/custom/inputs/DateTimePicker"
import { TechnicianCardSelect } from "@/components/custom/inputs/TechnicianCardSelect"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { AssignmentType, AirconUnits, ServiceAppliance, ServicePayload } from "@/lib/constants/interface"
import { useServiceMutations } from "@/lib/mutations/services/useServiceMutations"
import { useAirconUnits } from "@/lib/queries/useAircons"
import { useClientWarrantyAppliances } from "@/lib/queries/services/useWarrantyAppliances"
import { useTechnicianChoices } from "@/lib/queries/useChoices"
import { cn } from "@/lib/utils/helpers"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ClipboardList,
  Home,
  Save,
  Search,
  Settings,
  ShieldCheck,
  SprayCan,
  Sparkles,
  Truck,
  User,
  Users,
  Wind,
  Wrench,
  Zap,
} from "lucide-react"
import React, { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"

// ── Options ──────────────────────────────────────────────────────────────

const serviceTypeOptions = [
  { label: "Repair", value: "repair", icon: Wrench },
  { label: "Dismantle", value: "dismantle", icon: Settings },
  { label: "Inspection", value: "inspection", icon: Search },
  { label: "Cleaning", value: "cleaning", icon: Sparkles },
  { label: "Motor Rewind", value: "motor_rewind", icon: Zap },
  { label: "Installation", value: "installation", icon: ArrowDownUp },
]

const serviceModeOptions = [
  { label: "Carry-In", value: "carry_in", icon: Wrench },
  { label: "Home Service", value: "home_service", icon: Home },
  { label: "Pull-Out", value: "pull_out", icon: Truck },
]

const servicePurposeOptions = [
  {
    label: "Standard",
    value: "standard",
    icon: ClipboardList,
    description: "Regular paid service",
  },
  {
    label: "Warranty Claim",
    value: "warranty_claim",
    icon: ShieldCheck,
    description: "Complementary warranty service",
  },
  {
    label: "Free Cleaning",
    value: "free_cleaning",
    icon: SprayCan,
    description: "Complementary cleaning service",
  },
]

const serviceSchema = z.object({
  client: z.number().nullable().optional(),
  service_purpose: z.enum(["standard", "warranty_claim", "free_cleaning"]),
  service_type: z.enum(
    [
      "repair",
      "dismantle",
      "inspection",
      "cleaning",
      "motor_rewind",
      "installation",
    ],
    { required_error: "Service type is required" },
  ),
  service_mode: z.enum(["carry_in", "home_service", "pull_out"], {
    required_error: "Service mode is required",
  }),
  override_address: z.string().optional(),
  override_contact_person: z.string().optional(),
  override_contact_number: z.string().optional(),
  appointment_datetime: z.date().nullable().optional(),
  reinstall_appointment_datetime: z.date().nullable().optional(),
  create_reinstall: z.boolean().optional(),
  reinstall_same_address: z.boolean().optional(),
  reinstall_override_address: z.string().optional(),
  reinstall_override_contact_person: z.string().optional(),
  reinstall_override_contact_number: z.string().optional(),
  pickup_date: z.date().nullable().optional(),
  delivery_date: z.date().nullable().optional(),
  received_at: z.date().nullable().optional(),
  technicians: z.array(z.number()).optional(),
})

type FormValues = z.infer<typeof serviceSchema>

// ── Step definitions ─────────────────────────────────────────────────────

const steps = [
  { id: 0, title: "Client & Type", icon: User },
  { id: 1, title: "Units", icon: Wind },
  { id: 2, title: "Schedule", icon: Calendar },
  { id: 3, title: "Team", icon: Users },
  { id: 4, title: "Review", icon: ClipboardList },
]

// ── Component ────────────────────────────────────────────────────────────

interface ServiceFormWizardProps {
  onClose: () => void
  forceClose?: () => void
  /** Pre-select a client (e.g. when creating from client detail page) */
  defaultClientId?: number
}

export default function ServiceFormWizard({
  onClose,
  forceClose,
  defaultClientId,
}: ServiceFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const { addService, linkAirconUnits } = useServiceMutations()

  // Unit selection state for step 1
  const [selectedFreeCleaningUnitIds, setSelectedFreeCleaningUnitIds] = useState<number[]>([])
  const [selectedWarrantyUnitIds, setSelectedWarrantyUnitIds] = useState<number[]>([])
  const [selectedWarrantyApplianceIds, setSelectedWarrantyApplianceIds] = useState<number[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      client: defaultClientId ?? undefined,
      service_purpose: "standard",
      service_type: undefined,
      service_mode: "carry_in",
      override_address: "",
      override_contact_person: "",
      override_contact_number: "",
      appointment_datetime: null,
      reinstall_appointment_datetime: null,
      create_reinstall: false,
      reinstall_same_address: true,
      reinstall_override_address: "",
      reinstall_override_contact_person: "",
      reinstall_override_contact_number: "",
      pickup_date: null,
      delivery_date: null,
      received_at: new Date(),
      technicians: [],
    },
    mode: "onChange",
  })

  const { clients } = useClients()
  const { data: technicians = [] } = useTechnicianChoices()

  const selectedMode = useWatch({ control: form.control, name: "service_mode" })
  const selectedServicePurpose = useWatch({
    control: form.control,
    name: "service_purpose",
  })
  const selectedServiceType = useWatch({
    control: form.control,
    name: "service_type",
  })
  const selectedClient = useWatch({ control: form.control, name: "client" })
  const createReinstall = useWatch({
    control: form.control,
    name: "create_reinstall",
  })
  const reinstallSameAddress = useWatch({
    control: form.control,
    name: "reinstall_same_address",
  })

  // Fetch client's aircon units for step 1 (Units step)
  const { data: clientUnitsData, isLoading: clientUnitsLoading } = useAirconUnits({
    limit: 100,
    filter: selectedClient ? { client: selectedClient } : undefined,
    enabled: !!selectedClient,
  })

  const clientUnits: AirconUnits[] = clientUnitsData?.results ?? []

  // Fetch past-repair appliances under active warranty for this client
  const { data: warrantyAppliancePage, isLoading: warrantyAppliancesLoading } = useClientWarrantyAppliances(
    selectedServicePurpose === "warranty_claim" && selectedClient ? selectedClient : undefined,
  )
  const warrantyAppliances: ServiceAppliance[] = warrantyAppliancePage?.results ?? []

  const freeCleaningEligibleUnits = clientUnits.filter(
    (u) => u.free_cleaning_status === "available" && !u.free_cleaning_redeemed,
  )
  const warrantyEligibleUnits = clientUnits.filter(
    (u) => u.warranty_status === "Under Warranty",
  )

  const toggleFreeCleaningUnit = (id: number) => {
    setSelectedFreeCleaningUnitIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toggleWarrantyUnit = (id: number) => {
    setSelectedWarrantyUnitIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toggleWarrantyAppliance = (id: number) => {
    setSelectedWarrantyApplianceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  // Reset unit selections when client changes
  useEffect(() => {
    setSelectedFreeCleaningUnitIds([])
    setSelectedWarrantyUnitIds([])
    setSelectedWarrantyApplianceIds([])
  }, [selectedClient])

  // Reset unit selections when service purpose changes
  useEffect(() => {
    setSelectedFreeCleaningUnitIds([])
    setSelectedWarrantyUnitIds([])
    setSelectedWarrantyApplianceIds([])
  }, [selectedServicePurpose])

  // Filter modes based on type
  const availableServiceModes =
    selectedServiceType === "motor_rewind"
      ? serviceModeOptions.filter((m) => m.value === "carry_in")
      : selectedServiceType === "installation" ||
          selectedServiceType === "dismantle"
        ? serviceModeOptions.filter((m) => m.value === "home_service")
        : serviceModeOptions

  const availableServiceTypes =
    selectedServicePurpose === "free_cleaning"
      ? serviceTypeOptions.filter((t) => t.value === "cleaning")
      : selectedServicePurpose === "warranty_claim"
        ? serviceTypeOptions.filter((t) => t.value === "repair")
        : serviceTypeOptions

  // Hide the Units step for standard services (not applicable)
  const visibleSteps =
    selectedServicePurpose === "standard"
      ? steps.filter((s) => s.id !== 1)
      : steps

  useEffect(() => {
    if (selectedServicePurpose === "free_cleaning") {
      form.setValue("service_type", "cleaning")
    } else if (selectedServicePurpose === "warranty_claim") {
      form.setValue("service_type", "repair")
    }
  }, [selectedServicePurpose, form])

  // Auto-set mode for installation / dismantle / motor_rewind
  useEffect(() => {
    if (
      (selectedServiceType === "installation" ||
        selectedServiceType === "dismantle") &&
      selectedMode !== "home_service"
    ) {
      form.setValue("service_mode", "home_service")
    }
  }, [selectedServiceType, selectedMode, form])

  useEffect(() => {
    if (selectedServiceType === "motor_rewind" && selectedMode !== "carry_in") {
      form.setValue("service_mode", "carry_in")
    }
  }, [selectedServiceType, selectedMode, form])

  // Auto-fill client address
  useEffect(() => {
    if (selectedClient) {
      const client = clients.find((c) => c.id === selectedClient)
      if (client) {
        if (!form.getValues("override_address"))
          form.setValue("override_address", client.address || "")
        if (!form.getValues("override_contact_person"))
          form.setValue("override_contact_person", client.full_name || "")
        if (!form.getValues("override_contact_number"))
          form.setValue("override_contact_number", client.contact_number || "")
      }
    }
  }, [selectedClient, clients, form])

  // ── Validation per step ──────────────────────────────────────────────

  const canAdvance = async (step: number): Promise<boolean> => {
    switch (step) {
      case 0: {
        const clientVal = form.getValues("client")
        if (!clientVal) {
          form.setError("client", {
            type: "manual",
            message: "Client is required",
          })
          return false
        }
        const valid = await form.trigger(["service_type", "service_mode"])
        return valid
      }
      case 1:
        // Units step — always skippable
        return true
      case 2: {
        const mode = form.getValues("service_mode")
        if (mode === "pull_out") {
          const pickup = form.getValues("pickup_date")
          if (!pickup) {
            form.setError("pickup_date", {
              type: "manual",
              message: "Pickup date is required for pull-out service",
            })
            return false
          }
        }

        if (form.getValues("create_reinstall")) {
          const sameAddress = form.getValues("reinstall_same_address") !== false
          if (!sameAddress && !form.getValues("reinstall_override_address")) {
            form.setError("reinstall_override_address", {
              type: "manual",
              message:
                "Reinstall address is required when using a different location",
            })
            return false
          }
        }
        return true
      }
      case 3:
        return true
      default:
        return true
    }
  }

  const goNext = async () => {
    if (await canAdvance(currentStep)) {
      const next = currentStep + 1
      // Skip Units step (id 1) when purpose is standard
      if (next === 1 && selectedServicePurpose === "standard") {
        setCurrentStep(2)
      } else {
        setCurrentStep((s) => Math.min(s + 1, steps.length - 1))
      }
    }
  }

  const goPrev = () => {
    const prev = currentStep - 1
    // Skip Units step (id 1) when going back for standard purpose
    if (prev === 1 && selectedServicePurpose === "standard") {
      setCurrentStep(0)
    } else {
      setCurrentStep((s) => Math.max(s - 1, 0))
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────

  const formatDateForBackend = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    const h = String(date.getHours()).padStart(2, "0")
    const mi = String(date.getMinutes()).padStart(2, "0")
    const s = String(date.getSeconds()).padStart(2, "0")
    return `${y}-${m}-${d}T${h}:${mi}:${s}`
  }

  const onSubmit = (data: FormValues) => {
    const getAssignmentType = (): AssignmentType => {
      return data.service_mode === "pull_out" ? "pickup" : "repair"
    }

    const payload: ServicePayload = {
      client: data.client!,
      service_type: data.service_type,
      service_mode: data.service_mode,
      is_complementary: data.service_purpose !== "standard",
      complementary_reason:
        data.service_purpose === "warranty_claim"
          ? "Warranty Claim"
          : data.service_purpose === "free_cleaning"
            ? "Free Cleaning"
            : undefined,
      override_address: data.override_address,
      override_contact_person: data.override_contact_person,
      override_contact_number: data.override_contact_number,
      pickup_date: data.pickup_date
        ? formatDateForBackend(data.pickup_date)
        : undefined,
      delivery_date: data.delivery_date
        ? formatDateForBackend(data.delivery_date)
        : undefined,
      received_at:
        data.service_mode === "carry_in" && data.received_at
          ? formatDateForBackend(data.received_at)
          : undefined,
      appointment_datetime: data.appointment_datetime
        ? formatDateForBackend(data.appointment_datetime)
        : undefined,
      reinstall_appointment_datetime: data.reinstall_appointment_datetime
        ? formatDateForBackend(data.reinstall_appointment_datetime)
        : undefined,
      create_reinstall:
        data.service_type === "dismantle" ? !!data.create_reinstall : false,
      reinstall_same_address: data.reinstall_same_address !== false,
      reinstall_override_address:
        data.reinstall_same_address === false
          ? data.reinstall_override_address || undefined
          : undefined,
      reinstall_override_contact_person:
        data.reinstall_same_address === false
          ? data.reinstall_override_contact_person || undefined
          : undefined,
      reinstall_override_contact_number:
        data.reinstall_same_address === false
          ? data.reinstall_override_contact_number || undefined
          : undefined,
      technician_assignments: data.technicians?.map((techId) => ({
        technician: techId,
        assignment_type: getAssignmentType(),
        appliance: null,
      })),
    }

    addService.mutate(payload, {
      onSuccess: (response) => {
        // After creating the service, link any selected aircon units
        const serviceId = response?.data?.id
        const hasFreeCleaningUnits = selectedFreeCleaningUnitIds.length > 0
        const hasWarrantyUnits = selectedWarrantyUnitIds.length > 0
        const hasWarrantyAppliances = selectedWarrantyApplianceIds.length > 0

        if (serviceId && (hasFreeCleaningUnits || hasWarrantyUnits || hasWarrantyAppliances)) {
          linkAirconUnits.mutate(
            {
              id: serviceId,
              data: {
                free_cleaning_unit_ids: hasFreeCleaningUnits
                  ? selectedFreeCleaningUnitIds
                  : undefined,
                warranty_unit_ids: hasWarrantyUnits
                  ? selectedWarrantyUnitIds.map((uid) => ({
                      unit_id: uid,
                      claim_type: "repair" as const,
                      issue_description: "Warranty service",
                    }))
                  : undefined,
                warranty_appliance_ids: hasWarrantyAppliances
                  ? selectedWarrantyApplianceIds
                  : undefined,
              },
            },
          )
        }

        if (forceClose) {
          forceClose()
        } else {
          onClose()
        }
      },
    })
  }

  const isSubmitting =
    addService.status === "pending" || linkAirconUnits.status === "pending"

  // ── Helpers for Review step ────────────────────────────────────────────

  const clientName = React.useMemo(() => {
    const c = clients.find((cl) => cl.id === form.getValues("client"))
    return c ? `${c.full_name} (${c.contact_number})` : "—"
  }, [clients, form, currentStep]) // eslint-disable-line react-hooks/exhaustive-deps

  const technicianNames = React.useMemo(() => {
    const ids = form.getValues("technicians") ?? []
    return ids
      .map((id) => technicians.find((t) => t.id === id)?.full_name)
      .filter(Boolean)
  }, [technicians, form, currentStep]) // eslint-disable-line react-hooks/exhaustive-deps

  const typeLabel = serviceTypeOptions.find(
    (o) => o.value === form.getValues("service_type"),
  )?.label
  const purposeLabel = servicePurposeOptions.find(
    (o) => o.value === form.getValues("service_purpose"),
  )?.label
  const modeLabel = serviceModeOptions.find(
    (o) => o.value === form.getValues("service_mode"),
  )?.label

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Step indicators */}
        <nav className="flex items-center justify-between gap-2">
          {visibleSteps.map((step, i) => {
            const StepIcon = step.icon
            const isActive = step.id === currentStep
            const isDone = step.id < currentStep
            return (
              <React.Fragment key={step.id}>
                {i > 0 && (
                  <div
                    className={cn(
                      "h-px flex-1 transition-colors",
                      isDone ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (isDone) setCurrentStep(step.id)
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all whitespace-nowrap",
                    isActive &&
                      "bg-primary/10 text-primary ring-1 ring-primary/20",
                    isDone &&
                      "bg-primary/5 text-primary cursor-pointer hover:bg-primary/10",
                    !isActive && !isDone && "text-muted-foreground",
                  )}
                  disabled={!isDone && !isActive}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center size-6 rounded-full text-xs font-bold shrink-0",
                      isActive && "bg-primary text-primary-foreground",
                      isDone && "bg-primary text-primary-foreground",
                      !isActive && !isDone && "bg-muted text-muted-foreground",
                    )}
                  >
                    {isDone ? (
                      <Check className="size-3.5" />
                    ) : (
                      <StepIcon className="size-3.5" />
                    )}
                  </div>
                  <span className="hidden sm:inline">{step.title}</span>
                </button>
              </React.Fragment>
            )
          })}
        </nav>

        <Separator />

        {/* ── Step 0: Client & Type ──────────────────────────────────── */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <FormField
              name="client"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Client</FormLabel>
                  <ClientCardSelect
                    value={field.value ?? null}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="service_purpose"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Service Purpose</FormLabel>
                  <CardSelect
                    options={servicePurposeOptions}
                    value={field.value ?? null}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    columns={3}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="service_type"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Service Type</FormLabel>
                  <CardSelect
                    options={availableServiceTypes}
                    value={field.value ?? null}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedServicePurpose !== "standard" && (
              <p className="text-xs text-muted-foreground rounded-md border border-dashed px-3 py-2 bg-muted/30">
                This service will be created as complementary and will not
                require payment.
              </p>
            )}

            <FormField
              name="service_mode"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Service Mode</FormLabel>
                  <CardSelect
                    options={availableServiceModes}
                    value={field.value ?? null}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    columns={3}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* ── Step 1: Aircon Units ───────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                {selectedServicePurpose === "free_cleaning"
                  ? "Select this client's RVDC units eligible for a free cleaning. Skip if the unit is not tracked in RVDC inventory — you can add appliance details manually in the Appliances tab after creating the service."
                  : "Optionally link an RVDC-tracked unit under warranty. You can skip this step — warranty also applies to past-repair appliances and newly installed units that may not be in the inventory yet. Add those manually in the Appliances tab after creating the service."}
              </p>
              {selectedServicePurpose === "warranty_claim" && (
                <p className="text-xs text-muted-foreground border border-dashed rounded-md px-3 py-2 bg-muted/30">
                  This step is <span className="font-medium text-foreground">optional</span>. Skip if the warranted appliance is not an RVDC-sold unit (e.g. a unit from a past repair or a brand new install not yet registered).
                </p>
              )}
            </div>

            {!selectedClient && (
              <p className="text-sm text-muted-foreground italic">
                Select a client in step 1 to see eligible units.
              </p>
            )}

            {selectedClient && (clientUnitsLoading || warrantyAppliancesLoading) && (
              <p className="text-sm text-muted-foreground">Loading units…</p>
            )}

            {selectedClient && !clientUnitsLoading && (
              <>
                {/* Free Cleaning Section */}
                {selectedServicePurpose === "free_cleaning" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <SprayCan className="size-4 text-blue-500" />
                      <span className="text-sm font-semibold">
                        Free Cleaning Eligible
                      </span>
                      {freeCleaningEligibleUnits.length === 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          None available
                        </Badge>
                      )}
                    </div>
                    {freeCleaningEligibleUnits.length > 0 ? (
                      <div className="grid gap-2">
                        {freeCleaningEligibleUnits.map((unit) => (
                          <label
                            key={unit.id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                              selectedFreeCleaningUnitIds.includes(unit.id)
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                                : "border-border hover:border-muted-foreground/40",
                            )}
                          >
                            <Checkbox
                              checked={selectedFreeCleaningUnitIds.includes(
                                unit.id,
                              )}
                              onCheckedChange={() =>
                                toggleFreeCleaningUnit(unit.id)
                              }
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {unit.model?.brand?.name ?? ""}{" "}
                                {unit.model?.name ?? "Unknown Model"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                SN: {unit.serial_number}
                              </p>
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-xs shrink-0 text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/30"
                            >
                              <SprayCan className="size-3 mr-1" />
                              Free Cleaning
                            </Badge>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground pl-1 py-4 text-center border border-dashed rounded-lg">
                        This client has no units eligible for free cleaning. You can skip and add appliance details manually.
                      </p>
                    )}
                    {selectedFreeCleaningUnitIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 rounded-lg">
                        <span className="text-xs text-muted-foreground self-center mr-1">
                          Selected:
                        </span>
                        {selectedFreeCleaningUnitIds.map((id) => {
                          const u = freeCleaningEligibleUnits.find((x) => x.id === id)
                          return (
                            <Badge
                              key={`fc-${id}`}
                              variant="secondary"
                              className="text-xs text-blue-600"
                            >
                              <SprayCan className="size-3 mr-1" />
                              {u?.serial_number ?? id}
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Warranty Section */}
                {selectedServicePurpose === "warranty_claim" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-green-500" />
                    <span className="text-sm font-semibold">Under Warranty</span>
                    {warrantyEligibleUnits.length === 0 && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        None available
                      </Badge>
                    )}
                  </div>
                  {warrantyEligibleUnits.length > 0 ? (
                    <div className="grid gap-2">
                      {warrantyEligibleUnits.map((unit) => (
                        <label
                          key={unit.id}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                            selectedWarrantyUnitIds.includes(unit.id)
                              ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                              : "border-border hover:border-muted-foreground/40",
                          )}
                        >
                          <Checkbox
                            checked={selectedWarrantyUnitIds.includes(unit.id)}
                            onCheckedChange={() => toggleWarrantyUnit(unit.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {unit.model?.brand?.name ?? ""}{" "}
                              {unit.model?.name ?? "Unknown Model"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              SN: {unit.serial_number}
                            </p>
                            {unit.warranty_end_date && (
                              <p className="text-xs text-muted-foreground">
                                Warranty until:{" "}
                                {new Date(
                                  unit.warranty_end_date,
                                ).toLocaleDateString("en-PH")}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0 text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30"
                          >
                            <ShieldCheck className="size-3 mr-1" />
                            Warranty
                          </Badge>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground pl-1 py-4 text-center border border-dashed rounded-lg">
                      This client has no units under warranty. You can skip and add appliance details manually.
                    </p>
                  )}
                  {selectedWarrantyUnitIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 rounded-lg">
                      <span className="text-xs text-muted-foreground self-center mr-1">
                        Selected:
                      </span>
                      {selectedWarrantyUnitIds.map((id) => {
                        const u = warrantyEligibleUnits.find((x) => x.id === id)
                        return (
                          <Badge
                            key={`w-${id}`}
                            variant="secondary"
                            className="text-xs text-green-600"
                          >
                            <ShieldCheck className="size-3 mr-1" />
                            {u?.serial_number ?? id}
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
                )}

                {/* Past-repair / installed appliances under warranty */}
                {selectedServicePurpose === "warranty_claim" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Wrench className="size-4 text-amber-500" />
                      <span className="text-sm font-semibold">Past Repair / Installed Appliances Under Warranty</span>
                      {warrantyAppliances.length === 0 && (
                        <Badge variant="outline" className="text-xs">
                          None found
                        </Badge>
                      )}
                    </div>
                    {warrantyAppliances.length > 0 ? (
                      <div className="grid gap-2">
                        {warrantyAppliances.map((appliance: ServiceAppliance) => (
                          <label
                            key={appliance.id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                              selectedWarrantyApplianceIds.includes(appliance.id)
                                ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                                : "border-border hover:border-muted-foreground/40",
                            )}
                          >
                            <Checkbox
                              checked={selectedWarrantyApplianceIds.includes(appliance.id)}
                              onCheckedChange={() => toggleWarrantyAppliance(appliance.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {appliance.appliance_type?.name ?? "Unknown Type"}
                                {appliance.brand ? ` • ${appliance.brand}` : ""}
                                {appliance.model ? ` ${appliance.model}` : ""}
                              </p>
                              {appliance.serial_number && (
                                <p className="text-xs text-muted-foreground">SN: {appliance.serial_number}</p>
                              )}
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {appliance.is_labor_warranty_active && (
                                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                                    Labor warranty until {appliance.labor_warranty_end_date
                                      ? new Date(appliance.labor_warranty_end_date).toLocaleDateString("en-PH")
                                      : "—"}
                                  </Badge>
                                )}
                                {appliance.is_unit_warranty_active && (
                                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                                    Unit warranty until {appliance.unit_warranty_end_date
                                      ? new Date(appliance.unit_warranty_end_date).toLocaleDateString("en-PH")
                                      : "—"}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                  SVC-{appliance.service}
                                </Badge>
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-xs shrink-0 text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30"
                            >
                              <Wrench className="size-3 mr-1" />
                              Warranty
                            </Badge>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground pl-1 py-4 text-center border border-dashed rounded-lg">
                        No past-repair or installed appliances with active warranty found for this client.
                      </p>
                    )}
                    {selectedWarrantyApplianceIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 rounded-lg">
                        <span className="text-xs text-muted-foreground self-center mr-1">Selected:</span>
                        {selectedWarrantyApplianceIds.map((id) => {
                          const a = warrantyAppliances.find((x: ServiceAppliance) => x.id === id)
                          return (
                            <Badge key={`wa-${id}`} variant="secondary" className="text-xs text-amber-600">
                              <Wrench className="size-3 mr-1" />
                              {a?.appliance_type?.name ?? `Appliance #${id}`}
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Step 2: Schedule & Location ─────────────────────────────── */}
        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Carry-In: Received At */}
            {selectedMode === "carry_in" && (
              <div className="space-y-4">
                <FormField
                  name="received_at"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Received At</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={field.value ?? undefined}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                          placeholder="When customer dropped off unit"
                          disablePastDates={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Home Service */}
            {selectedMode === "home_service" && (
              <div className="space-y-4">
                <FormField
                  name="appointment_datetime"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Appointment Date & Time{" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          (optional — can be set later)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={field.value ?? undefined}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                          placeholder="Select appointment date and time"
                          disablePastDates={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="override_address"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Address</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Auto-filled from client or enter custom address"
                          disabled={isSubmitting}
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    name="override_contact_person"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Auto-filled from client"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="override_contact_number"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Auto-filled from client"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Pull-Out */}
            {selectedMode === "pull_out" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    name="pickup_date"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Pickup Date & Time</FormLabel>
                        <FormControl>
                          <DateTimePicker
                            value={field.value ?? undefined}
                            onChange={field.onChange}
                            disabled={isSubmitting}
                            placeholder="Select pickup date and time"
                            disablePastDates={true}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="delivery_date"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Date</FormLabel>
                        <FormControl>
                          <DateTimePicker
                            value={field.value ?? undefined}
                            onChange={field.onChange}
                            disabled={isSubmitting}
                            placeholder="Select delivery date and time"
                            disablePastDates={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  name="override_address"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Address</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Auto-filled from client or enter custom address"
                          disabled={isSubmitting}
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    name="override_contact_person"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Auto-filled from client"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="override_contact_number"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Auto-filled from client"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {selectedMode === "carry_in" && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No scheduling needed for carry-in services. You can proceed to
                the next step.
              </p>
            )}

            {selectedServiceType === "dismantle" && (
              <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                <FormField
                  name="create_reinstall"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true)
                          }
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">
                          Auto-create linked reinstall service
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Creates an installation service linked to this
                          dismantle service.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {createReinstall && (
                  <>
                    <FormField
                      name="reinstall_same_address"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reinstall Address Setup</FormLabel>
                          <CardSelect
                            options={[
                              {
                                label: "Same Address",
                                value: "same",
                                icon: Home,
                              },
                              {
                                label: "Different Address",
                                value: "override",
                                icon: ArrowDownUp,
                              },
                            ]}
                            value={field.value === false ? "override" : "same"}
                            onChange={(value) => {
                              const isSame = value !== "override"
                              field.onChange(isSame)
                              if (isSame) {
                                form.setValue("reinstall_override_address", "")
                                form.setValue(
                                  "reinstall_override_contact_person",
                                  "",
                                )
                                form.setValue(
                                  "reinstall_override_contact_number",
                                  "",
                                )
                              }
                            }}
                            disabled={isSubmitting}
                            columns={2}
                          />
                        </FormItem>
                      )}
                    />

                    {reinstallSameAddress === false && (
                      <>
                        <FormField
                          name="reinstall_override_address"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel required>Reinstall Address</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="Enter reinstall address"
                                  disabled={isSubmitting}
                                  rows={2}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            name="reinstall_override_contact_person"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reinstall Contact Person</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="Same as dismantle if empty"
                                    disabled={isSubmitting}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            name="reinstall_override_contact_number"
                            control={form.control}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reinstall Contact Number</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="Same as dismantle if empty"
                                    disabled={isSubmitting}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}

                    <FormField
                      name="reinstall_appointment_datetime"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Reinstall Appointment
                          </FormLabel>
                          <FormControl>
                            <DateTimePicker
                              value={field.value ?? undefined}
                              onChange={field.onChange}
                              disabled={isSubmitting}
                              placeholder="Set preferred reinstall date/time"
                              disablePastDates={true}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Technicians ────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <FormField
              name="technicians"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Technicians</FormLabel>
                  <TechnicianCardSelect
                    technicians={technicians}
                    selected={
                      field.value?.filter(
                        (id) => id !== undefined && id !== null,
                      ) ?? []
                    }
                    onChange={field.onChange}
                    disabled={isSubmitting}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* ── Step 4: Review ──────────────────────────────────────────── */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <User className="size-4" /> Client & Service
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Client</span>
                    <p className="font-medium">{clientName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Purpose</span>
                    <p className="font-medium">{purposeLabel ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type</span>
                    <p className="font-medium">{typeLabel ?? "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mode</span>
                    <p className="font-medium">{modeLabel ?? "—"}</p>
                  </div>
                  {selectedServiceType === "dismantle" && createReinstall && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Linked Flow</span>
                      <p className="font-medium">
                        Dismantle + Auto-created Reinstall
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Schedule info */}
            {(selectedMode === "home_service" ||
              selectedMode === "pull_out") && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="size-4" /> Schedule & Location
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {selectedMode === "home_service" &&
                      form.getValues("appointment_datetime") && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">
                            Appointment
                          </span>
                          <p className="font-medium">
                            {form
                              .getValues("appointment_datetime")
                              ?.toLocaleString("en-PH")}
                          </p>
                        </div>
                      )}
                    {selectedMode === "pull_out" &&
                      form.getValues("pickup_date") && (
                        <div>
                          <span className="text-muted-foreground">Pickup</span>
                          <p className="font-medium">
                            {form
                              .getValues("pickup_date")
                              ?.toLocaleString("en-PH")}
                          </p>
                        </div>
                      )}
                    {selectedMode === "pull_out" &&
                      form.getValues("delivery_date") && (
                        <div>
                          <span className="text-muted-foreground">
                            Delivery
                          </span>
                          <p className="font-medium">
                            {form
                              .getValues("delivery_date")
                              ?.toLocaleString("en-PH")}
                          </p>
                        </div>
                      )}
                    {form.getValues("override_address") && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Address</span>
                        <p className="font-medium">
                          {form.getValues("override_address")}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Technicians */}
            {technicianNames.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="size-4" /> Assigned Technicians
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {technicianNames.map((name) => (
                      <Badge
                        key={name}
                        variant="secondary"
                      >
                        {name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Units */}
            {(selectedFreeCleaningUnitIds.length > 0 ||
              selectedWarrantyUnitIds.length > 0 ||
              selectedWarrantyApplianceIds.length > 0) && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Wind className="size-4" /> Linked Units &amp; Appliances
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFreeCleaningUnitIds.map((id) => {
                      const u = freeCleaningEligibleUnits.find(
                        (x) => x.id === id,
                      )
                      return (
                        <Badge
                          key={`fc-review-${id}`}
                          variant="secondary"
                          className="text-xs text-blue-600"
                        >
                          <SprayCan className="size-3 mr-1" />
                          {u?.serial_number ?? id} (Free Cleaning)
                        </Badge>
                      )
                    })}
                    {selectedWarrantyUnitIds.map((id) => {
                      const u = warrantyEligibleUnits.find((x) => x.id === id)
                      return (
                        <Badge
                          key={`w-review-${id}`}
                          variant="secondary"
                          className="text-xs text-green-600"
                        >
                          <ShieldCheck className="size-3 mr-1" />
                          {u?.serial_number ?? id} (Warranty – RVDC Unit)
                        </Badge>
                      )
                    })}
                    {selectedWarrantyApplianceIds.map((id) => {
                      const a = warrantyAppliances.find((x: ServiceAppliance) => x.id === id)
                      return (
                        <Badge
                          key={`wa-review-${id}`}
                          variant="secondary"
                          className="text-xs text-amber-600"
                        >
                          <Wrench className="size-3 mr-1" />
                          {a?.appliance_type?.name ?? `Appliance #${id}`} (Warranty – Past Repair)
                        </Badge>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-muted-foreground text-center">
              After creating this service, you can add appliances and inventory
              items from the service details page.
            </p>
          </div>
        )}

        <Separator />

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goPrev}
            disabled={currentStep === 0 || isSubmitting}
          >
            <ArrowLeft className="size-4 mr-1.5" />
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              size="sm"
              onClick={goNext}
            >
              Next
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
            >
              <Save className="size-4 mr-1.5" />
              {isSubmitting ? "Creating…" : "Create Service"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
