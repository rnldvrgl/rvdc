'use client'

import { ComboBox } from '@/components/custom/inputs/ComboBox'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { AirconUnitPayload } from '@/lib/constants/infers'
import { AirconUnits } from '@/lib/constants/interface'
import { AirconUnitSchema } from '@/lib/constants/schema'
import { useAirconUnitMutations } from '@/lib/mutations/installations/useAirconUnitMutations'
import { useAirconModels } from '@/lib/queries/useAircons'
import { useClientChoices } from '@/lib/queries/useChoices'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

interface Props {
  initialData?: AirconUnits
  onClose: () => void
}

export default function AirconUnitForm({ initialData, onClose }: Props) {
  const isEditing = !!initialData
  const { addUnit, updateUnit } = useAirconUnitMutations()
  const { data: models } = useAirconModels({ limit: 100 })
  const { data: clients } = useClientChoices()

  const form = useForm<AirconUnitPayload>({
    resolver: zodResolver(AirconUnitSchema),
    defaultValues: {
      serial_number: initialData?.serial_number ?? '',
      model_id: initialData?.model?.id ?? undefined,
      reserved_by: initialData?.reserved_by?.id ?? null,
    },
    mode: 'onSubmit',
  })

  const { handleSubmit, control, reset } = form

  useEffect(() => {
    if (initialData) {
      reset({
        model_id: initialData.model?.id,
        serial_number: initialData.serial_number,
        reserved_by: initialData.reserved_by?.id ?? null,
      })
    }
  }, [initialData, reset])

  const handleFormSubmit = (data: AirconUnitPayload) => {
    const payload: AirconUnitPayload = {
      serial_number: data.serial_number,
      model_id: data.model_id,
      reserved_by: data.reserved_by ?? null,
    }

    if (isEditing && initialData) {
      updateUnit.mutate(
        { id: initialData.id, data: payload },
        { onSuccess: onClose },
      )
    } else {
      addUnit.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-8"
      >
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          <Separator />

          <FormField
            control={control}
            name="model_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aircon Model</FormLabel>
                <FormControl>
                  <ComboBox
                    value={field.value ?? null}
                    onChange={(val) => field.onChange(val ?? undefined)}
                    options={
                      models?.results.map((m) => ({
                        value: m.id,
                        label: m.name,
                      })) ?? []
                    }
                    placeholder="Select aircon model"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="serial_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serial Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter serial number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Reservation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Reservation</h3>
          <Separator />

          <FormField
            control={control}
            name="reserved_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reserved By</FormLabel>
                <FormControl>
                  <ComboBox
                    value={field.value ?? null}
                    onChange={(val) => field.onChange(val ?? undefined)}
                    options={
                      clients?.map((c) => ({
                        value: c.id,
                        label: `${c.full_name} (${c.contact_number})`,
                      })) ?? []
                    }
                    placeholder="Select client (optional)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit */}
        <div className="sticky bottom-0 flex justify-end border-t bg-background pt-4 shadow-sm">
          <Button type="submit">
            {isEditing ? 'Update Unit' : 'Add Unit'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
