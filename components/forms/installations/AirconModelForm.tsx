"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { zodResolver } from "@hookform/resolvers/zod"
import { Control, Resolver, useForm, useWatch } from "react-hook-form"

import { AirconModelPayload } from "@/lib/constants/infers"
import { AirconModels } from "@/lib/constants/interface"
import { AirconModelSchema, DiscountOnlySchema } from "@/lib/constants/schema"
import { useAirconModelMutations } from "@/lib/mutations/installations/useAirconModelMutations"
import {
  useAirconBrandsChoices,
  useAirconTypesChoices,
  useHorsePowerChoices,
} from "@/lib/queries/useChoices"
import { formatCurrency } from "@/lib/utils/helpers"

interface Props {
  initialData?: AirconModels
  isAddingDiscount?: boolean
  onClose: () => void
}

const clampDiscount = (value?: number | string) => {
  const n =
    value === "" || value === undefined ? undefined : Math.floor(Number(value))
  if (n === undefined || Number.isNaN(n)) return undefined
  return Math.min(Math.max(n, 0), 100)
}

/* ----------------- Discount Fields ----------------- */
function DiscountFields({
  control,
  retailPrice,
}: {
  control: Control<AirconModelPayload> // 👈 unified type
  retailPrice: string | undefined
}) {
  const discount = useWatch({ control, name: "discount_percentage" })
  const promoPrice =
    retailPrice && discount !== undefined
      ? Number(retailPrice) * (1 - Number(discount) / 100)
      : undefined

  return (
    <div className="grid gap-3">
      <FormField
        control={control}
        name="discount_percentage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Discount % (optional)</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="number"
                step={1}
                min={0}
                max={100}
                placeholder="Leave blank if no discount"
                value={field.value ?? ""}
                onChange={(e) => {
                  const clamped = clampDiscount(e.target.value)
                  e.target.value = clamped?.toString() ?? ""
                  field.onChange(clamped)
                }}
                onBlur={(e) => {
                  const clamped = clampDiscount(e.target.value)
                  e.target.value = clamped?.toString() ?? ""
                  field.onChange(clamped)
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {promoPrice !== undefined && (
        <div className="flex items-center justify-between rounded-md border border-green-400 bg-green-50 px-3 py-2">
          <span className="text-sm font-medium text-green-700">
            Promo Price
          </span>
          <span className="text-lg font-semibold text-green-700">
            {formatCurrency(promoPrice.toFixed(2))}
          </span>
        </div>
      )}
    </div>
  )
}

/* ----------------- Full Model Fields ----------------- */
function ModelFields({
  control,
  airconBrands,
  airconTypes,
  horsePowerOptions,
  retailPrice,
}: {
  control: Control<AirconModelPayload> // 👈 unified type
  airconBrands?: { id: number; name: string }[]
  airconTypes?: { value: string | number; label: string }[]
  horsePowerOptions?: { value: string | number; label: string }[]
  retailPrice: string | undefined
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Model Details</CardTitle>
            <p className="text-sm text-muted-foreground">
              Basic information about the model
            </p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField
              control={control}
              name="brand_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <ComboBox
                      value={field.value ?? null}
                      onChange={(val) => field.onChange(val ?? undefined)}
                      options={
                        airconBrands?.map((b) => ({
                          value: b.id,
                          label: b.name,
                        })) ?? []
                      }
                      placeholder="Select brand"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Split Type X123"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="aircon_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aircon Type</FormLabel>
                  <FormControl>
                    <ComboBox
                      value={field.value ?? null}
                      onChange={(val) => field.onChange(val ?? undefined)}
                      options={
                        airconTypes?.map((t) => ({
                          value: t.value,
                          label: t.label,
                        })) ?? []
                      }
                      placeholder="Select type"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="horsepower"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horsepower</FormLabel>
                  <FormControl>
                    <ComboBox
                      value={field.value ?? null}
                      onChange={(val) => field.onChange(val ?? undefined)}
                      options={
                        horsePowerOptions?.map((hp) => ({
                          value: hp.value,
                          label: hp.label,
                        })) ?? []
                      }
                      placeholder="Select horsepower"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <p className="text-sm text-muted-foreground">
              Retail price and optional discount
            </p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField
              control={control}
              name="retail_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retail Price</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step={0.01}
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DiscountFields
              control={control}
              retailPrice={retailPrice}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Specs</CardTitle>
            <p className="text-sm text-muted-foreground">
              Technical attributes for classification
            </p>
          </CardHeader>
          <CardContent>
            <FormField
              control={control}
              name="is_inverter"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-4 rounded-md border p-4 hover:bg-muted/40">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                    </FormControl>
                    <div className="flex flex-col">
                      <FormLabel className="text-base cursor-pointer">
                        Inverter Model
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Mark this if the model uses inverter technology
                      </p>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ----------------- Main Form ----------------- */
export default function AirconModelForm({
  initialData,
  isAddingDiscount,
  onClose,
}: Props) {
  const isEditing = !!initialData
  const { addModel, updateModel } = useAirconModelMutations()
  const { data: airconTypes } = useAirconTypesChoices()
  const { data: airconBrands } = useAirconBrandsChoices()
  const { data: horsePowerOptions } = useHorsePowerChoices()

  const form = useForm<AirconModelPayload>({
    resolver: zodResolver(
      isAddingDiscount ? DiscountOnlySchema : AirconModelSchema,
    ) as unknown as Resolver<AirconModelPayload>,
    defaultValues: {
      brand_id: initialData?.brand?.id ?? undefined,
      name: initialData?.name ?? "",
      retail_price: initialData?.retail_price ?? "",
      discount_percentage:
        initialData?.discount_percentage !== undefined
          ? Number(initialData.discount_percentage)
          : undefined,
      aircon_type: initialData?.aircon_type ?? undefined,
      horsepower: initialData?.horsepower ?? undefined,
      is_inverter: initialData?.is_inverter ?? false,
    },
    mode: "onSubmit",
  })

  const { handleSubmit, control } = form
  const retailPrice = useWatch({ control, name: "retail_price" })

  const handleFormSubmit = (data: AirconModelPayload) => {
    const payload: Partial<AirconModels> = {
      ...data,
      discount_percentage: data.discount_percentage?.toString(),
    }

    if (isAddingDiscount && initialData) {
      updateModel.mutate(
        { id: initialData.id, data: payload },
        { onSuccess: onClose },
      )
      return
    }

    if (isEditing && initialData) {
      updateModel.mutate(
        { id: initialData.id, data: payload },
        { onSuccess: onClose },
      )
    } else {
      addModel.mutate(payload as Omit<AirconModels, "id">, {
        onSuccess: onClose,
      })
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {isAddingDiscount ? (
          <DiscountFields
            control={control}
            retailPrice={retailPrice}
          />
        ) : (
          <ModelFields
            control={control}
            airconBrands={airconBrands}
            airconTypes={airconTypes}
            horsePowerOptions={horsePowerOptions}
            retailPrice={retailPrice}
          />
        )}

        <div className="sticky bottom-0 flex justify-end border-t bg-background pt-4 shadow-sm">
          <Button type="submit">
            {isAddingDiscount
              ? initialData?.discount_percentage
                ? "Update Discount"
                : "Add Discount"
              : isEditing
                ? "Update Model"
                : "Save Model"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
