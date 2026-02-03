"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { DateTimePicker } from "@/components/custom/inputs/DateTimePicker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { MultiSelect } from "@/components/ui/multi-select"
import { Textarea } from "@/components/ui/textarea"
import {
  AssignmentType,
  Service,
  ServiceMode,
  ServicePayload,
  ServiceStatus,
  ServiceType,
} from "@/lib/constants/interface"
import { useServiceMutations } from "@/lib/mutations/services/useServiceMutations"
import {
  useClientChoices,
  useTechnicianChoices,
} from "@/lib/queries/useChoices"
import { zodResolver } from "@hookform/resolvers/zod"
import { Info, Save } from "lucide-react"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"

const serviceTypeOptions = [
  { label: "Repair", value: "repair" },
  { label: "Inspection", value: "inspection" },
  { label: "Cleaning", value: "cleaning" },
  { label: "Motor Rewind", value: "motor_rewind" },
  { label: "Installation", value: "installation" },
]

const serviceModeOptions = [
  { label: "Carry-In", value: "carry_in" },
  { label: "Home Service", value: "home_service" },
  { label: "Pull-Out", value: "pull_out" },
]

const serviceStatusOptions = [
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
]

const serviceSchema = z.object({
  client: z.number({ required_error: "Client is required" }),
  service_type: z.enum(
    ["repair", "inspection", "cleaning", "motor_rewind", "installation"],
    {
      required_error: "Service type is required",
    },
  ),
  service_mode: z.enum(["carry_in", "home_service", "pull_out"], {
    required_error: "Service mode is required",
  }),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .optional(),
  related_transaction: z.number().nullable().optional(),
  description: z.string().optional(),
  override_address: z.string().optional(),
  override_contact_person: z.string().optional(),
  override_contact_number: z.string().optional(),
  appointment_datetime: z.date().nullable().optional(),
  pickup_date: z.date().nullable().optional(),
  delivery_date: z.date().nullable().optional(),
  received_at: z.date().nullable().optional(),
  remarks: z.string().optional(),
  notes: z.string().optional(),
  technicians: z.array(z.number()).optional(),
})

type FormValues = z.infer<typeof serviceSchema>

interface ServiceFormProps {
  initialData?: Service
  onClose: () => void
}

export default function ServiceForm({
  initialData,
  onClose,
}: ServiceFormProps) {
  const { addService, updateService } = useServiceMutations()

  const form = useForm<FormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      client: initialData?.client?.id ?? undefined,
      service_type: (initialData?.service_type as ServiceType) ?? undefined,
      service_mode: (initialData?.service_mode as ServiceMode) ?? "carry_in",
      status: (initialData?.status as ServiceStatus) ?? "pending",
      related_transaction: initialData?.related_transaction ?? null,
      description: initialData?.description ?? "",
      override_address: initialData?.override_address ?? "",
      override_contact_person: initialData?.override_contact_person ?? "",
      override_contact_number: initialData?.override_contact_number ?? "",
      appointment_datetime: null,
      pickup_date: initialData?.pickup_date
        ? new Date(initialData.pickup_date)
        : null,
      delivery_date: initialData?.delivery_date
        ? new Date(initialData.delivery_date)
        : null,
      received_at: initialData?.received_at
        ? new Date(initialData.received_at)
        : null,
      remarks: initialData?.remarks ?? "",
      notes: initialData?.notes ?? "",
      technicians:
        initialData?.technician_assignments
          ?.map((ta) => ta.technician)
          .filter((id): id is number => id !== undefined && id !== null) ?? [],
    },
    mode: "onChange",
  })

  const { data: clients = [] } = useClientChoices()
  const { data: technicians = [] } = useTechnicianChoices()

  const selectedMode = useWatch({
    control: form.control,
    name: "service_mode",
  })

  const selectedServiceType = useWatch({
    control: form.control,
    name: "service_type",
  })

  const selectedClient = useWatch({
    control: form.control,
    name: "client",
  })

  // Filter service modes based on service type
  const availableServiceModes =
    selectedServiceType === "motor_rewind"
      ? serviceModeOptions.filter((mode) => mode.value === "carry_in")
      : serviceModeOptions

  // Auto-fill client address and contact when client is selected
  useEffect(() => {
    if (selectedClient && !initialData) {
      const client = clients.find((c) => c.id === selectedClient)
      if (client) {
        // Only auto-fill if fields are empty
        if (!form.getValues("override_address")) {
          form.setValue("override_address", client.address || "")
        }
        if (!form.getValues("override_contact_person")) {
          form.setValue("override_contact_person", client.full_name || "")
        }
        if (!form.getValues("override_contact_number")) {
          form.setValue("override_contact_number", client.contact_number || "")
        }
      }
    }
  }, [selectedClient, clients, initialData, form])

  // Auto-set carry_in mode for motor_rewind
  useEffect(() => {
    if (selectedServiceType === "motor_rewind" && selectedMode !== "carry_in") {
      form.setValue("service_mode", "carry_in")
    }
  }, [selectedServiceType, selectedMode, form])

  const onSubmit = (data: FormValues) => {
    // Determine assignment type based on service mode
    const getAssignmentType = (): AssignmentType => {
      switch (data.service_mode) {
        case "pull_out":
          return "pickup"
        default:
          return "repair"
      }
    }

    const payload: ServicePayload = {
      client: data.client,
      service_type: data.service_type,
      service_mode: data.service_mode,
      status: data.status,
      related_transaction: data.related_transaction ?? undefined,
      description: data.description,
      override_address: data.override_address,
      override_contact_person: data.override_contact_person,
      override_contact_number: data.override_contact_number,
      pickup_date: data.pickup_date
        ? data.pickup_date.toISOString()
        : undefined,
      delivery_date: data.delivery_date
        ? data.delivery_date.toISOString()
        : undefined,
      received_at: data.received_at
        ? data.received_at.toISOString()
        : undefined,
      appointment_datetime: data.appointment_datetime
        ? data.appointment_datetime.toISOString()
        : undefined,
      remarks: data.remarks,
      notes: data.notes,
      technician_assignments: data.technicians?.map((techId) => ({
        technician: techId,
        assignment_type: getAssignmentType(),
        appliance: null,
      })),
    }

    if (initialData) {
      updateService.mutate(
        { id: initialData.id, data: payload },
        {
          onSuccess: () => {
            onClose()
          },
        },
      )
    } else {
      addService.mutate(payload, {
        onSuccess: () => {
          onClose()
        },
      })
    }
  }

  const isSubmitting =
    addService.status === "pending" || updateService.status === "pending"

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Info Alert for New Services */}
        {!initialData && (
          <Alert variant="info">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> After creating this service, you&apos;ll
              need to add appliances and items to generate sales when completing
              the service. You can do this by editing the service or viewing its
              details.
            </AlertDescription>
          </Alert>
        )}

        {/* Client */}
        <FormField
          name="client"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Client</FormLabel>
              <ComboBox
                options={clients.map((c) => ({
                  value: c.id,
                  label: `${c.full_name} (${c.contact_number})`,
                }))}
                value={field.value ?? null}
                onChange={field.onChange}
                placeholder="Select client"
                disabled={isSubmitting}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Service Type */}
          <FormField
            name="service_type"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Service Type</FormLabel>
                <ComboBox
                  options={serviceTypeOptions}
                  value={field.value ?? null}
                  onChange={field.onChange}
                  placeholder="Select type"
                  disabled={isSubmitting}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Service Mode */}
          <FormField
            name="service_mode"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Service Mode</FormLabel>
                <ComboBox
                  options={availableServiceModes}
                  value={field.value ?? null}
                  onChange={field.onChange}
                  placeholder="Select mode"
                  disabled={isSubmitting}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Status - Show only when editing */}
        {initialData && (
          <FormField
            name="status"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <ComboBox
                  options={serviceStatusOptions}
                  value={field.value ?? null}
                  onChange={field.onChange}
                  placeholder="Select status"
                  disabled={isSubmitting}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Technicians */}
        <FormField
          name="technicians"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign Technicians</FormLabel>
              <MultiSelect
                options={technicians.map((tech) => ({
                  value: tech.id.toString(),
                  label: tech.full_name,
                }))}
                selected={
                  field.value
                    ?.filter((id) => id !== undefined && id !== null)
                    .map((id) => id.toString()) ?? []
                }
                onChange={(values: string[]) => {
                  field.onChange(values.map((v: string) => Number(v)))
                }}
                placeholder="Select technicians"
                disabled={isSubmitting}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe the service or issue"
                  disabled={isSubmitting}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Carry-In Fields */}
        {selectedMode === "carry_in" && (
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-medium text-sm">Carry-In Service Details</h3>
            <FormField
              name="received_at"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Received At (Optional)</FormLabel>
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

        {/* Home Service Fields */}
        {selectedMode === "home_service" && (
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-medium text-sm">Home Service Details</h3>

            <FormField
              name="appointment_datetime"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Appointment Date & Time</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
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

        {/* Pull-Out Fields */}
        {selectedMode === "pull_out" && (
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-medium text-sm">Pull-Out Service Details</h3>

            <div className="grid grid-cols-2 gap-4">
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
                    <FormLabel>Delivery Date & Time (Optional)</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
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

        {/* Remarks */}
        <FormField
          name="remarks"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Additional remarks"
                  disabled={isSubmitting}
                  rows={2}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          name="notes"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internal Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Internal notes (not visible to client)"
                  disabled={isSubmitting}
                  rows={2}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={!form.formState.isDirty || isSubmitting}
          className="w-full"
        >
          <Save className="mr-2 h-4 w-4" />
          {initialData ? "Update Service" : "Create Service"}
        </Button>
      </form>
    </Form>
  )
}
