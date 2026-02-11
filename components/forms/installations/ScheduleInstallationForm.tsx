"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import DatePicker from "@/components/custom/inputs/DatePicker"
import TimePicker from "@/components/custom/inputs/TimePicker"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { AirconInstallationCreatePayload } from "@/lib/constants/interface"
import { useAirconInstallationMutations } from "@/lib/mutations/installations/useAirconInstallationMutations"
import { useClients } from "@/lib/queries/clients/useClients"
import { zodResolver } from "@hookform/resolvers/zod"
import { Label } from "@radix-ui/react-label"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"

const InstallationSchema = z.object({
  client_id: z.number().optional(),
  scheduled_date: z.date().optional(),
  scheduled_time: z.string().optional(),
  labor_fee: z.number().min(0),
  labor_is_free: z.boolean(),
  sell_unit_now: z.boolean(),
  payment_type: z.enum(["cash", "gcash", "credit", "debit", "cheque"]),
})

type InstallationFormData = z.infer<typeof InstallationSchema>

interface Props {
  unitId: number
  unitSerialNumber: string
  isUnitSold: boolean
  onClose: () => void
  onSuccess?: (serviceId: number) => void
}

export default function ScheduleInstallationForm({
  unitId,
  unitSerialNumber,
  isUnitSold,
  onClose,
  onSuccess,
}: Props) {
  const router = useRouter()
  const { createInstallation } = useAirconInstallationMutations()
  const { data: clients } = useClients({ limit: 100 })

  const form = useForm<InstallationFormData>({
    resolver: zodResolver(InstallationSchema),
    defaultValues: {
      client_id: undefined,
      scheduled_date: undefined,
      scheduled_time: undefined,
      labor_fee: 0,
      labor_is_free: false,
      sell_unit_now: !isUnitSold,
      payment_type: "cash",
    },
  })

  const { handleSubmit, control, watch, setValue } = form
  const labor_is_free = watch("labor_is_free")
  const sellUnitNow = watch("sell_unit_now")

  // Auto-set labor_fee to 0 when labor_is_free is checked
  if (labor_is_free && watch("labor_fee") !== 0) {
    setValue("labor_fee", 0)
  }

  const handleFormSubmit = (data: InstallationFormData) => {
    const payload: AirconInstallationCreatePayload = {
      unit_id: unitId,
      client_id: data.client_id,
      scheduled_date: data.scheduled_date
        ? data.scheduled_date.toISOString().split("T")[0]
        : undefined,
      scheduled_time: data.scheduled_time,
      labor_fee: data.labor_fee,
      labor_is_free: data.labor_is_free,
      sell_unit_now: data.sell_unit_now,
      payment_type: data.payment_type,
    }

    createInstallation.mutate(payload, {
      onSuccess: (response) => {
        onClose()
        if (onSuccess) {
          onSuccess(response.service_id)
        } else {
          // Redirect to service detail page
          router.push(`/services/${response.service_id}`)
        }
      },
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">
              Unit: <span className="font-mono">{unitSerialNumber}</span>
            </p>
            {!isUnitSold && (
              <p className="text-sm text-amber-600 mt-1">
                ⚠️ Unit is not sold yet. Choose to sell now or reserve for
                client.
              </p>
            )}
          </div>

          <Separator />

          {/* Sell Unit First (if not sold) */}
          {!isUnitSold && (
            <>
              <FormField
                control={control}
                name="sell_unit_now"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Sell Unit Now</FormLabel>
                      <FormDescription>
                        Check this to sell the unit before scheduling
                        installation. If unchecked, unit will be reserved for
                        the client.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <FormControl>
                      <ComboBox
                        value={field.value ?? null}
                        onChange={(val: string | number | null) =>
                          field.onChange(val as number | undefined)
                        }
                        options={
                          clients?.results.map((c) => ({
                            value: c.id,
                            label: `${c.full_name} (${c.contact_number})`,
                          })) ?? []
                        }
                        placeholder="Select client"
                      />
                    </FormControl>
                    <FormDescription>
                      {sellUnitNow
                        ? "Client purchasing the unit"
                        : "Unit will be reserved for this client"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {sellUnitNow && (
                <>
                  <FormField
                    control={control}
                    name="payment_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <FormControl>
                          <ComboBox
                            value={field.value}
                            onChange={(val: string | number | null) =>
                              field.onChange((val as string) ?? "cash")
                            }
                            options={[
                              { value: "cash", label: "Cash" },
                              { value: "gcash", label: "GCash" },
                              { value: "credit", label: "Credit Card" },
                              { value: "debit", label: "Debit Card" },
                              { value: "cheque", label: "Cheque" },
                            ]}
                            placeholder="Select payment method"
                          />
                        </FormControl>
                        <FormDescription>
                          Payment method for unit purchase
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />
                </>
              )}
            </>
          )}

          {/* Installation Details */}
          <h3 className="text-lg font-semibold">Installation Details</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name="scheduled_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      field={field}
                      placeholder="Select date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="scheduled_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled Time</FormLabel>
                  <FormControl>
                    <TimePicker
                      field={field}
                      placeholder="Select time"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <h3 className="text-lg font-semibold">Labor Fee</h3>

          <div className="flex items-center space-x-2">
            <FormField
              control={control}
              name="labor_is_free"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      id="labor_is_free"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <Label
                    htmlFor="labor_is_free"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Labor is Free (Promotional)
                  </Label>
                </FormItem>
              )}
            />
          </div>

          {!labor_is_free && (
            <FormField
              control={control}
              name="labor_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Labor Fee (₱)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Installation labor fee. Copper tube and other parts can be
                    added later in the service detail page.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createInstallation.isPending}
          >
            {createInstallation.isPending
              ? "Creating..."
              : "Create Installation Service"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
