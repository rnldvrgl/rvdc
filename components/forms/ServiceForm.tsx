"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import DatePicker from "@/components/custom/inputs/DatePicker"
import TimePicker from "@/components/custom/inputs/TimePicker"
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
import { useClientChoices } from "@/lib/queries/useChoices"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"

const serviceTypeOptions = [
  { label: "Repair", value: "repair" },
  { label: "Check-up", value: "check_up" },
  { label: "Cleaning", value: "cleaning" },
]

const serviceModeOptions = [
  { label: "In Shop", value: "in_shop" },
  { label: "Home Service", value: "home_service" },
  { label: "Pickup and Return", value: "pickup" },
]

const serviceSchema = z.object({
  client_id: z.number({ required_error: "Client is required" }),
  service_type: z.enum(["repair", "check_up", "cleaning"], {
    required_error: "Type is required",
  }),
  service_mode: z.enum(["in_shop", "home_service", "pickup"], {
    required_error: "Mode is required",
  }),
  related_transaction_id: z.number().nullable().optional(),
  description: z.string().optional(),
  remarks: z.string().optional(),
  scheduled_date: z.coerce.date().nullable().optional(),
  scheduled_time: z.string().nullable().optional(),
})

export type FormValues = z.infer<typeof serviceSchema>

interface ServiceFormProps {
  initialData?: FormValues
  onClose: () => void
}

export default function ServiceForm({
  initialData,
  onClose,
}: ServiceFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: initialData ?? {
      client_id: undefined,
      service_type: undefined,
      service_mode: "in_shop",
      related_transaction_id: null,
      description: "",
      remarks: "",
      scheduled_date: null,
      scheduled_time: null,
    },
    mode: "onChange",
  })

  const { data: clients = [] } = useClientChoices()

  const selectedMode = useWatch({
    control: form.control,
    name: "service_mode",
  })

  const onSubmit = (data: FormValues) => {
    onClose()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Client</FormLabel>
              <ComboBox
                options={clients.map((c) => ({
                  value: c.id,
                  label: c.full_name,
                }))}
                value={field.value ?? null}
                onChange={field.onChange}
                placeholder="Select client"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="service_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Service Type</FormLabel>
              <ComboBox
                options={serviceTypeOptions}
                value={field.value ?? null}
                onChange={field.onChange}
                placeholder="Select type"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="service_mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Service Mode</FormLabel>
              <ComboBox
                options={serviceModeOptions}
                value={field.value ?? null}
                onChange={field.onChange}
                placeholder="Select mode"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedMode !== "in_shop" && (
          <>
            <FormField
              name="scheduled_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Scheduled Date</FormLabel>
                  <DatePicker field={field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="scheduled_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Scheduled Time</FormLabel>
                  <TimePicker
                    field={field}
                    format="12"
                    interval={60}
                    placeholder="Choose time"
                    label="Scheduled Time"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Describe the issue"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Additional notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={!form.formState.isDirty || form.formState.isSubmitting}
          className="w-full"
        >
          <Save className="mr-2 h-4 w-4" />
          {initialData ? "Update Service" : "Create Service"}
        </Button>
      </form>
    </Form>
  )
}
