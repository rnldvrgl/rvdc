'use client'

import { ComboBox } from '@/components/custom/inputs/ComboBox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { AirconModelPayload } from '@/lib/constants/infers'
import { AirconModels } from '@/lib/constants/interface'
import { AirconModelSchema, DiscountOnlySchema } from '@/lib/constants/schema'
import { useAirconModelMutations } from '@/lib/mutations/installations/useAirconModelMutations'
import {
  useAirconBrandsChoices,
  useAirconTypesChoices,
} from '@/lib/queries/useChoices'
import { formatCurrency } from '@/lib/utils/helpers'

interface Props {
  initialData?: AirconModels
  isAddingDiscount?: boolean
  onClose: () => void
}

const clampDiscount = (value?: number | string) => {
  const n =
    value === '' || value === undefined ? undefined : Math.floor(Number(value))
  if (n === undefined || Number.isNaN(n)) return undefined
  return Math.min(Math.max(n, 0), 100)
}

/* ----------------- Discount Fields ----------------- */
function DiscountFields({
  control,
  retailPrice,
}: {
  control: any
  retailPrice: string | undefined
}) {
  const discount = useWatch({ control, name: 'discount_percentage' })
  const promoPrice =
    retailPrice && discount !== undefined
      ? Number(retailPrice) * (1 - Number(discount) / 100)
      : undefined

  return (
    <div className="grid gap-2">
      <Controller
        control={control}
        name="discount_percentage"
        render={({ field: { value, onChange, onBlur, ...rest } }) => (
          <FormItem>
            <FormLabel>Discount % (optional)</FormLabel>
            <FormControl>
              <Input
                {...rest}
                type="number"
                step={1}
                min={0}
                max={100}
                placeholder="Leave blank if no discount"
                value={value ?? ''}
                onChange={(e) => {
                  const clamped = clampDiscount(e.target.value)
                  e.target.value = clamped?.toString() ?? ''
                  onChange(clamped)
                }}
                onBlur={(e) => {
                  onBlur()
                  const clamped = clampDiscount(e.target.value)
                  e.target.value = clamped?.toString() ?? ''
                  onChange(clamped)
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {promoPrice !== undefined && (
        <div className="flex items-center gap-2 rounded-md border border-green-300 px-3 py-2">
          <span className="text-sm font-medium text-green-700">
            Promo Price:
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
  retailPrice,
}: {
  control: any
  airconBrands?: { id: number; name: string }[]
  airconTypes?: { value: string | number; label: string }[]
  retailPrice: string | undefined
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left column */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Model Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Controller
              control={control}
              name="brand_id"
              render={({ field: { value, onChange, ...rest } }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <ComboBox
                      value={
                        value === undefined || typeof value === 'boolean'
                          ? null
                          : String(value)
                      }
                      onChange={onChange}
                      options={
                        airconBrands?.map((b) => ({
                          value: String(b.id),
                          label: b.name,
                        })) ?? []
                      }
                      placeholder="Select brand"
                      {...rest}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="e.g., Split Type X123"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={control}
              name="aircon_type"
              render={({ field: { value, onChange, ...rest } }) => (
                <FormItem>
                  <FormLabel>Aircon Type</FormLabel>
                  <FormControl>
                    <ComboBox
                      value={
                        value === undefined || typeof value === 'boolean'
                          ? null
                          : String(value)
                      }
                      onChange={onChange}
                      options={
                        airconTypes?.map((t) => ({
                          value: String(t.value),
                          label: t.label,
                        })) ?? []
                      }
                      placeholder="Select type"
                      {...rest}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>

      {/* Right column */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Controller
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
                      value={field.value ?? ''}
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
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="is_inverter"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>Inverter Model</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Mark this if the model uses inverter technology
                      </p>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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

  const resolverSchema = isAddingDiscount
    ? DiscountOnlySchema
    : AirconModelSchema

  const form = useForm<AirconModelPayload>({
    resolver: zodResolver(resolverSchema as any),
    defaultValues: {
      brand_id: initialData?.brand?.id
        ? Number(initialData.brand.id)
        : undefined,
      name: initialData?.name ?? '',
      retail_price: initialData?.retail_price ?? '',
      discount_percentage:
        initialData?.discount_percentage !== undefined
          ? parseInt(String(initialData.discount_percentage), 10)
          : undefined,
      aircon_type: initialData?.aircon_type
        ? initialData.aircon_type
        : undefined,
      is_inverter: initialData?.is_inverter ?? false,
    },
    mode: 'onSubmit',
  })

  const { handleSubmit, control } = form
  const retailPrice = useWatch({ control, name: 'retail_price' })

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
      addModel.mutate(payload as Omit<AirconModels, 'id'>, {
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
            retailPrice={retailPrice}
          />
        )}

        {/* Sticky Footer */}
        <div className="sticky bottom-0 flex justify-end border-t bg-background pt-4">
          <Button type="submit">
            {isAddingDiscount
              ? initialData?.discount_percentage
                ? 'Update Discount'
                : 'Add Discount'
              : isEditing
              ? 'Update Model'
              : 'Save Model'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
