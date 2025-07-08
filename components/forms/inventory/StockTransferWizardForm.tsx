'use client'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Item, Stall, StockTransfer } from '@/lib/constants/interface'
import { Technician } from '@/lib/constants/types'
import { useStockTransferMutations } from '@/lib/mutations/useStockTransferMutations'
import {
  useItemChoices,
  useStallChoices,
  useTechnicianChoices,
} from '@/lib/queries/useChoices'
import useUserProfileStore from '@/lib/store/useUserProfileStore'
import { formatDate } from '@/lib/utils/helpers'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

interface FormValues {
  to_stall: string | null
  technician: string | null
}

export default function StockTransferForm({
  onClose,
  initialData,
}: {
  onClose: () => void
  initialData?: StockTransfer
}) {
  const form = useForm<FormValues>({
    defaultValues: {
      to_stall: initialData?.to_stall?.id?.toString() ?? null,
      technician: initialData?.technician?.id?.toString() ?? null,
    },
  })

  const { data: stallsData } = useStallChoices()
  const { data: techniciansData } = useTechnicianChoices()
  const { data: allItemsData } = useItemChoices()
  const user = useUserProfileStore((state) => state.userProfile)

  const stalls: Stall[] = stallsData ?? []
  const technicians: Technician[] = techniciansData ?? []
  const allItems: Item[] = allItemsData ?? []

  const [items, setItems] = useState<{ item: Item; quantity: number }[]>([])

  const { addStockTransfer, updateStockTransfer, finalizeStockTransfer } =
    useStockTransferMutations()

  useEffect(() => {
    if (initialData) {
      setItems(
        initialData.items?.map((i) => ({
          item: i.item ?? null,
          quantity: i.quantity ?? 0,
        })) ?? [],
      )
    }
  }, [initialData])

  const handleSubmit = (values: FormValues) => {
    const payload = {
      from_stall: user?.assigned_stall?.id,
      to_stall: parseInt(values.to_stall ?? '0'),
      technician: parseInt(values.technician ?? '0'),
      items: items.map((itm) => ({
        item: itm.item.id,
        quantity: itm.quantity,
      })),
    }

    if (initialData?.id) {
      updateStockTransfer.mutate(
        { id: initialData.id, data: payload },
        { onSuccess: onClose },
      )
    } else {
      addStockTransfer.mutate(payload, { onSuccess: onClose })
    }
  }

  const handleFinalize = () => {
    if (initialData?.id) {
      finalizeStockTransfer.mutate(initialData.id, { onSuccess: onClose })
    }
  }

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4 max-w-sm mx-auto"
        >
          {/* To Stall */}
          <FormField
            control={form.control}
            name="to_stall"
            rules={{ required: 'Destination stall is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">To Stall</FormLabel>
                <FormControl>
                  <Select
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Stall" />
                    </SelectTrigger>
                    <SelectContent>
                      {stalls.map((stall) => (
                        <SelectItem
                          key={stall.id}
                          value={stall.id.toString()}
                        >
                          {stall.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Technician */}
          <FormField
            control={form.control}
            name="technician"
            rules={{ required: 'Technician is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Technician</FormLabel>
                <FormControl>
                  <Select
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((tech) => (
                        <SelectItem
                          key={tech.id}
                          value={tech.id.toString()}
                        >
                          {tech.first_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Items */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">Items</span>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  setItems([...items, { item: allItems[0], quantity: 1 }])
                }
              >
                Add Item
              </Button>
            </div>

            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No items added yet. Click "Add Item" to start.
              </p>
            )}

            {items.map((itm, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_70px_auto] gap-2 items-center w-full"
              >
                <div className="flex w-full">
                  <Select
                    value={itm.item.id.toString()}
                    onValueChange={(val) =>
                      setItems((prev) =>
                        prev.map((i, ix) =>
                          ix === idx
                            ? {
                                ...i,
                                item: allItems.find(
                                  (itm) => itm.id === parseInt(val),
                                )!,
                              }
                            : i,
                        ),
                      )
                    }
                  >
                    <SelectTrigger
                      className="w-full flex-1 truncate"
                      style={{ width: '100%' }}
                    >
                      <SelectValue placeholder="Select Item" />
                    </SelectTrigger>
                    <SelectContent>
                      {allItems.map((item) => (
                        <SelectItem
                          key={item.id}
                          value={item.id.toString()}
                        >
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Input
                  type="number"
                  min={1}
                  value={itm.quantity}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((i, ix) =>
                        ix === idx
                          ? { ...i, quantity: parseInt(e.target.value) || 1 }
                          : i,
                      ),
                    )
                  }
                  className="w-full"
                />

                <Button
                  type="button"
                  variant="destructive"
                  className="!size-5"
                  size="icon"
                  onClick={() =>
                    setItems((prev) => prev.filter((_, ix) => ix !== idx))
                  }
                >
                  ×
                </Button>
              </div>
            ))}
          </div>

          {/* Transfer Info */}
          {initialData && (
            <div className="text-xs text-muted-foreground pt-2">
              <p>
                Created on:{' '}
                {initialData.transfer_date &&
                  formatDate(new Date(initialData.transfer_date))}
              </p>
              {initialData.is_finalized && initialData.finalized_at && (
                <p>
                  Finalized at: {formatDate(new Date(initialData.finalized_at))}
                </p>
              )}
            </div>
          )}

          {/* Submit & Finalize Buttons */}
          <div className="flex justify-between gap-2 pt-4">
            <Button
              type="submit"
              size="sm"
              disabled={!form.formState.isValid || items.length === 0}
            >
              {initialData ? 'Save Changes' : 'Submit Transfer'}
            </Button>

            {initialData && !initialData.is_finalized && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleFinalize}
                disabled={finalizeStockTransfer.isPending}
              >
                {finalizeStockTransfer.isPending
                  ? 'Finalizing...'
                  : 'Finalize Transfer'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </FormProvider>
  )
}
