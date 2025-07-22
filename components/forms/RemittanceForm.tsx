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
import { Textarea } from '@/components/ui/textarea'
import { RemittancePayload } from '@/lib/constants/infers'
import { RemittancePayloadSchema } from '@/lib/constants/schema'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { useRemittanceMutations } from '@/lib/mutations/useRemittanceMutations'
import { useStallChoices } from '@/lib/queries/useChoices'
import useUserProfileStore from '@/lib/store/useUserProfileStore'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

type FormValues = z.infer<typeof RemittancePayloadSchema>

interface RemittanceFormProps {
  onClose: () => void
  initialData?: FormValues
}

export default function RemittanceForm({
  onClose,
  initialData,
}: RemittanceFormProps) {
  const { role } = useCurrentUser()
  const userProfile = useUserProfileStore((s) => s.userProfile)
  const { addRemittance, updateRemittance } = useRemittanceMutations()
  const { data: stalls } = useStallChoices({})

  const form = useForm<FormValues>({
    resolver: zodResolver(RemittancePayloadSchema),
    defaultValues: {
      stall:
        initialData?.stall ??
        (role === 'admin' ? undefined : userProfile?.assigned_stall?.id),
      date: initialData?.date ?? new Date().toISOString().split('T')[0],
      notes: initialData?.notes ?? '',
      cash_breakdown: {
        count_1000: initialData?.cash_breakdown?.count_1000 ?? undefined,
        count_500: initialData?.cash_breakdown?.count_500 ?? undefined,
        count_100: initialData?.cash_breakdown?.count_100 ?? undefined,
        count_50: initialData?.cash_breakdown?.count_50 ?? undefined,
        count_20: initialData?.cash_breakdown?.count_20 ?? undefined,
        count_10: initialData?.cash_breakdown?.count_10 ?? undefined,
        count_5: initialData?.cash_breakdown?.count_5 ?? undefined,
        count_1: initialData?.cash_breakdown?.count_1 ?? undefined,
        coins_remitted: initialData?.cash_breakdown?.coins_remitted ?? false,
      },
    },
  })

  const isEditing = !!initialData
  const isRemitted = initialData?.is_remitted ?? false
  const disabled = isRemitted

  const onSubmit = (data: FormValues) => {
    if (isRemitted) return // prevent updating if already remitted

    const stallId =
      role === 'admin' ? data.stall : userProfile?.assigned_stall?.id

    if (!stallId) {
      console.error('Missing stall ID')
      return
    }

    const payload: RemittancePayload = {
      ...data,
      stall: stallId,
    }

    if (isEditing) {
      updateRemittance.mutate(
        { id: initialData.id!, data: payload },
        { onSuccess: onClose },
      )
    } else {
      addRemittance.mutate(payload, { onSuccess: onClose })
    }
  }

  const denominations: {
    label: string
    name:
      | 'count_1000'
      | 'count_500'
      | 'count_100'
      | 'count_50'
      | 'count_20'
      | 'count_10'
      | 'count_5'
      | 'count_1'
  }[] = [
    { label: '₱1000', name: 'count_1000' },
    { label: '₱500', name: 'count_500' },
    { label: '₱100', name: 'count_100' },
    { label: '₱50', name: 'count_50' },
    { label: '₱20', name: 'count_20' },
    { label: '₱10', name: 'count_10' },
    { label: '₱5', name: 'count_5' },
    { label: '₱1', name: 'count_1' },
  ]

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-xl"
      >
        <div className="grid gap-6">
          {role === 'admin' && (
            <FormField
              control={form.control}
              name="stall"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Stall</FormLabel>
                  <ComboBox
                    options={
                      stalls?.map((s) => ({ value: s.id, label: s.name })) ?? []
                    }
                    value={field.value ?? null}
                    onChange={field.onChange}
                    placeholder="Select stall"
                    disabled={disabled}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="border rounded-2xl p-4 shadow-sm space-y-4">
            <h1 className="text-base font-semibold">Cash Breakdown</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {denominations.map((denom) => (
                <FormField
                  key={denom.name}
                  control={form.control}
                  name={`cash_breakdown.${denom.name}` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{denom.label}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          disabled={disabled}
                          value={
                            field.value === undefined || field.value === null
                              ? ''
                              : field.value
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ''
                                ? undefined
                                : e.target.valueAsNumber,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <FormField
              control={form.control}
              name="cash_breakdown.coins_remitted"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormLabel className="text-sm">Coins Remitted</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Optional notes..."
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={disabled}
          >
            {isEditing ? 'Update Remittance' : 'Save Remittance'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
