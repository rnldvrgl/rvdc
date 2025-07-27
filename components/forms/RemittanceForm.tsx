'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { useRemittanceMutations } from '@/lib/mutations/useRemittanceMutations'
import { useStallChoices } from '@/lib/queries/useChoices'
import useUserProfileStore from '@/lib/store/useUserProfileStore'

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { RemittanceRecordPayload } from '@/lib/constants/infers'
import { RemittanceRecordSchema } from '@/lib/constants/schema'

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 1] as const

interface Props {
  initialData?: RemittanceRecordPayload
  onClose: () => void
}

export default function RemittanceForm({ initialData, onClose }: Props) {
  const { role } = useCurrentUser()
  const userProfile = useUserProfileStore((s) => s.userProfile)
  const { data: stalls } = useStallChoices({})
  const { addRemittance, updateRemittance } = useRemittanceMutations()

  const isEditing = !!initialData
  const isRemitted = initialData?.is_remitted ?? false
  const disabled = isRemitted

  // ✅ Compute syncStates based on whether declared == to_remit
  const defaultSyncStates: Record<number, boolean> = Object.fromEntries(
    DENOMINATIONS.map((denom) => {
      const declared =
        initialData?.cash_breakdown?.[`declared_count_${denom}`] ?? 0
      const count = initialData?.cash_breakdown?.[`count_${denom}`] ?? 0
      return [denom, declared === count]
    }),
  )

  const [syncStates, setSyncStates] =
    useState<Record<number, boolean>>(defaultSyncStates)

  const form = useForm<RemittanceRecordPayload>({
    resolver: zodResolver(RemittanceRecordSchema),
    defaultValues: {
      stall:
        initialData?.stall ??
        (role === 'admin' ? undefined : userProfile?.assigned_stall?.id),
      notes: initialData?.notes ?? '',
      cash_breakdown: {
        ...Object.fromEntries(
          DENOMINATIONS.flatMap((d) => [
            [`count_${d}`, initialData?.cash_breakdown?.[`count_${d}`] ?? 0],
            [
              `declared_count_${d}`,
              initialData?.cash_breakdown?.[`declared_count_${d}`] ?? 0,
            ],
          ]),
        ),
      },
    },
  })

  const { setValue, getValues, control, handleSubmit } = form

  const getCountField = (denom: number): keyof RemittanceRecordPayload =>
    `cash_breakdown.count_${denom}` as keyof RemittanceRecordPayload

  const getDeclaredField = (denom: number): keyof RemittanceRecordPayload =>
    `cash_breakdown.declared_count_${denom}` as keyof RemittanceRecordPayload

  const handleDeclaredChange = (denom: number, value: number) => {
    setValue(getDeclaredField(denom), value)
    if (syncStates[denom]) {
      setValue(getCountField(denom), value)
    }
  }

  const handleSyncToggle = (denom: number, checked: boolean) => {
    setSyncStates((prev) => ({ ...prev, [denom]: checked }))
    if (checked) {
      const declared = getValues(getDeclaredField(denom))
      setValue(getCountField(denom), declared)
    } else {
      setValue(getCountField(denom), 0)
    }
  }

  const onSubmit = (data: RemittanceRecordPayload) => {
    if (isRemitted) return

    const stallId =
      role === 'admin' ? data.stall : userProfile?.assigned_stall?.id

    if (!stallId) {
      console.error('Missing stall ID')
      return
    }

    const payload: RemittanceRecordPayload = {
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

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid space-y-6 max-w-xl"
      >
        {role === 'admin' && (
          <FormField
            control={control}
            name="stall"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Stall</FormLabel>
                <FormControl>
                  <ComboBox
                    options={
                      stalls?.map((s) => ({ value: s.id, label: s.name })) ?? []
                    }
                    value={field.value ?? null}
                    onChange={field.onChange}
                    placeholder="Select stall"
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="space-y-4 rounded-xl border bg-background p-4 shadow-sm">
          <FormLabel
            className="text-lg"
            required
          >
            Cash Breakdown
          </FormLabel>

          <div className="overflow-x-auto mt-2">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="text-sm text-muted-foreground">
                  <TableHead className="w-1/6 text-right text-foreground font-semibold">
                    Denomination
                  </TableHead>
                  <TableHead className="w-1/4 text-center text-foreground font-semibold">
                    Declared
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-1 inline h-4 w-4 cursor-pointer text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Total number of bills or coins you counted for this
                        denomination.
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="w-1/4 text-center text-foreground font-semibold">
                    To Remit
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-1 inline h-4 w-4 cursor-pointer text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Number of bills or coins you&quot;re actually remitting.
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="w-1/6 text-center text-foreground font-semibold">
                    Same?
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-1 inline h-4 w-4 cursor-pointer text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        If checked, the &quot;To Remit&quot; count will
                        automatically match the declared amount.
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {DENOMINATIONS.map((denom) => (
                  <TableRow key={denom}>
                    <TableCell className="text-right font-medium text-foreground">
                      ₱{denom}
                    </TableCell>

                    {/* Declared */}
                    <TableCell className="text-center">
                      <FormField
                        control={control}
                        name={getDeclaredField(denom)}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="numeric"
                                className="w-20 text-center"
                                disabled={disabled}
                                min={0}
                                value={
                                  typeof field.value === 'number'
                                    ? field.value
                                    : 0
                                }
                                onChange={(e) => {
                                  const val = parseInt(e.target.value || '0')
                                  field.onChange(val)
                                  handleDeclaredChange(denom, val)
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* To Remit */}
                    <TableCell className="text-center">
                      <FormField
                        control={control}
                        name={getCountField(denom)}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                className="w-20 text-center"
                                disabled={disabled || syncStates[denom]}
                                value={
                                  typeof field.value === 'number'
                                    ? field.value
                                    : 0
                                }
                                onChange={(e) =>
                                  field.onChange(
                                    parseInt(e.target.value || '0'),
                                  )
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TableCell>

                    {/* Sync Checkbox */}
                    <TableCell className="text-center">
                      <Checkbox
                        checked={syncStates[denom] ?? true}
                        onCheckedChange={(v) =>
                          handleSyncToggle(denom, Boolean(v))
                        }
                        className="cursor-pointer"
                        disabled={disabled}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Notes */}
        <FormField
          control={control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Optional notes..."
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
