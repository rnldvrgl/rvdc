'use client'

import { ComboBox } from '@/components/custom/inputs/ComboBox'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { AirconModelPayload } from '@/lib/constants/infers'
import { AirconModels } from '@/lib/constants/interface'
import { AirconModelSchema, DiscountOnlySchema } from '@/lib/constants/schema'
import { useAirconModelMutations } from '@/lib/mutations/installations/useAirconModelMutations'
import {
  useAirconBrandsChoices,
  useAirconTypesChoices,
} from '@/lib/queries/useChoices'

interface Props {
  initialData?: AirconModels
  isAddingDiscount?: boolean
  onClose: () => void
}

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
      brand_id: initialData?.brand?.id,
      name: initialData?.name ?? '',
      retail_price: initialData?.retail_price ?? '',
      discount_percentage:
        initialData?.discount_percentage !== undefined
          ? parseInt(String(initialData.discount_percentage), 10)
          : undefined,
      aircon_type: initialData?.aircon_type,
      is_inverter: initialData?.is_inverter ?? false,
    },
    mode: 'onSubmit',
  })

  const { handleSubmit, control } = form

  // Watch for dynamic promo price calculation
  const discount = useWatch({ control, name: 'discount_percentage' })
  const retailPrice = useWatch({ control, name: 'retail_price' })
  const promoPrice =
    retailPrice && discount !== undefined
      ? Number(retailPrice) * (1 - Number(discount) / 100)
      : undefined

  const clampDiscount = (value?: number | string) => {
    if (value === '' || value === undefined) return undefined
    const n = Math.floor(Number(value))
    if (Number.isNaN(n)) return undefined
    return Math.min(Math.max(n, 0), 100)
  }

  const handleFormSubmit = (data: AirconModelPayload) => {
    if (isAddingDiscount && initialData) {
      updateModel.mutate(
        {
          id: initialData.id,
          data: {
            discount_percentage:
              data.discount_percentage === undefined
                ? undefined
                : String(data.discount_percentage),
          } as Partial<AirconModels>,
        },
        { onSuccess: onClose },
      )
      return
    }

    const payload: Omit<AirconModels, 'id'> = {
      ...data,
      discount_percentage:
        data.discount_percentage === undefined
          ? undefined
          : String(data.discount_percentage),
    }

    if (isEditing && initialData) {
      updateModel.mutate(
        { id: initialData.id, data: payload },
        { onSuccess: onClose },
      )
    } else {
      addModel.mutate(payload, { onSuccess: onClose })
    }
  }

  const renderDiscountField = () => (
    <FormField
      control={control}
      name="discount_percentage"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Discount % (optional)</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="1"
              min={0}
              max={100}
              placeholder="Leave blank if no discount"
              value={field.value ?? ''}
              onChange={(e) => {
                const value = e.target.value.trim()
                if (value === '') {
                  field.onChange(undefined)
                } else {
                  let n = parseInt(value, 10)
                  if (!Number.isNaN(n)) {
                    n = Math.min(Math.max(n, 0), 100) // clamp 0–100
                    field.onChange(n)
                  }
                }
              }}
              onBlur={(e) => {
                const value = e.target.value.trim()
                if (value === '') {
                  field.onChange(undefined)
                } else {
                  let n = Math.floor(Number(value))
                  if (!Number.isNaN(n)) {
                    n = Math.min(Math.max(n, 0), 100) // clamp 0–100
                    field.onChange(n)
                  }
                }
              }}
            />
          </FormControl>
          {promoPrice !== undefined && (
            <p className="mt-1 text-sm text-gray-500">
              Promo Price: ${promoPrice.toFixed(2)}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Enter a value between 0% and 100%. Leave blank if no discount.
          </p>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="grid gap-6 max-w-xl"
      >
        {isAddingDiscount ? (
          renderDiscountField()
        ) : (
          <>
            {/* Brand */}
            <FormField
              control={control}
              name="brand_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Brand</FormLabel>
                  <FormControl>
                    <ComboBox
                      options={
                        airconBrands?.map((b) => ({
                          value: b.id,
                          label: b.name,
                        })) ?? []
                      }
                      value={field.value ?? null}
                      onChange={field.onChange}
                      placeholder="Select brand"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Model Name */}
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Model Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Split Type X123"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Retail Price */}
            <FormField
              control={control}
              name="retail_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Retail Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Discount */}
            {renderDiscountField()}

            {/* Aircon Type */}
            <FormField
              control={control}
              name="aircon_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Aircon Type</FormLabel>
                  <FormControl>
                    <ComboBox
                      options={airconTypes ?? []}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select type"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Inverter */}
            <FormField
              control={control}
              name="is_inverter"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Inverter Model</FormLabel>
                </FormItem>
              )}
            />
          </>
        )}

        <div className="flex justify-end pt-4">
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
