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
import type { Item, Stall, StockTransfer } from '@/lib/constants/interface'
import type { Technician } from '@/lib/constants/types'
import { useStockTransferMutations } from '@/lib/mutations/useStockTransferMutations'
import {
  useItemChoices,
  useStallChoices,
  useTechnicianChoices,
} from '@/lib/queries/useChoices'
import useUserProfileStore from '@/lib/store/useUserProfileStore'
import { formatDate } from '@/lib/utils/helpers'
import { CheckCircle, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

interface FormValues {
  to_stall: string | null
  technician: string | null
  used_for: string
}

export default function StockTransferForm({
  onClose,
  initialData,
}: {
  onClose: () => void
  initialData?: StockTransfer
}) {
  const user = useUserProfileStore((state) => state.userProfile)
  const form = useForm<FormValues>({
    defaultValues: {
      to_stall: initialData?.to_stall?.id?.toString() ?? null,
      technician: initialData?.technician?.id?.toString() ?? null,
      used_for: initialData?.used_for ?? '',
    },
  })

  const isFinalized = !!initialData?.is_finalized
  const [items, setItems] = useState<{ item: Item; quantity: number }[]>([])
  const { data: allItemsData } = useItemChoices()
  const { data: stallsData } = useStallChoices({
    excludeAssignedStall: true,
    assignedStallId: user?.assigned_stall?.id ?? undefined,
  })
  const { data: techniciansData } = useTechnicianChoices()

  const stalls: Stall[] = stallsData ?? []
  const technicians: Technician[] = techniciansData ?? []
  const allItems: Item[] = allItemsData ?? []

  const { addStockTransfer, updateStockTransfer, finalizeStockTransfer } =
    useStockTransferMutations()

  useEffect(() => {
    if (!initialData) return

    // Only when initialData changes, we prepare items with nulls first
    setItems(
      initialData.items?.map((i) => ({
        item: i.item ?? null,
        quantity: i.quantity ?? 0,
      })) ?? [],
    )
  }, [initialData])

  // Then, after allItems is loaded, fill in missing
  useEffect(() => {
    if (allItems.length === 0) return

    setItems((prevItems) =>
      prevItems.map((i) => ({
        item: i.item ?? allItems[0],
        quantity: i.quantity,
      })),
    )
  }, [allItems])
  const handleSubmit = (values: FormValues) => {
    const payload = {
      from_stall: user?.assigned_stall?.id,
      to_stall: parseInt(values.to_stall ?? '0'),
      technician: parseInt(values.technician ?? '0'),
      used_for: values.used_for,
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
          className="space-y-4 max-w-full"
        >
          {/* Header dates & finalize */}
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground mb-1">
                Transfer Details
              </h4>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p>
                  Created:{' '}
                  <span className="font-medium">
                    {initialData?.transfer_date
                      ? formatDate(new Date(initialData.transfer_date))
                      : '–'}
                  </span>
                </p>
                <p>
                  Finalized:{' '}
                  <span className="font-medium">
                    {initialData?.is_finalized && initialData?.finalized_at
                      ? formatDate(new Date(initialData.finalized_at))
                      : '–'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {initialData && !initialData.is_finalized && (
                <Button
                  type="button"
                  variant="success"
                  size="sm"
                  onClick={handleFinalize}
                  disabled={finalizeStockTransfer.isPending}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="size-4 " />
                  {finalizeStockTransfer.isPending
                    ? 'Finalizing...'
                    : 'Finalize'}
                </Button>
              )}
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-3">
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
                      disabled={isFinalized}
                    >
                      <SelectTrigger
                        className="w-full"
                        disabled={isFinalized}
                        size="sm"
                      >
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
                      disabled={isFinalized}
                    >
                      <SelectTrigger
                        className="w-full"
                        disabled={isFinalized}
                        size="sm"
                      >
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
            <FormField
              control={form.control}
              name="used_for"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Used For</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="w-full"
                      placeholder="Enter used for"
                      disabled={isFinalized}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Items */}
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">Items</span>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  setItems([...items, { item: allItems[0], quantity: 1 }])
                }
                disabled={isFinalized}
                className="flex items-center gap-1"
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>

            {items.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No items added yet.
              </p>
            )}

            <div className="space-y-2">
              {items.map((itm, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 min-w-[8rem]">
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
                      disabled={isFinalized}
                    >
                      <SelectTrigger
                        disabled={isFinalized}
                        className="w-full"
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

                  <div className="w-20">
                    <Input
                      type="number"
                      min={1}
                      value={itm.quantity}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((i, ix) =>
                            ix === idx
                              ? {
                                  ...i,
                                  quantity: parseInt(e.target.value) || 1,
                                }
                              : i,
                          ),
                        )
                      }
                      disabled={isFinalized}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="group"
                    onClick={() =>
                      setItems((prev) => prev.filter((_, ix) => ix !== idx))
                    }
                    disabled={isFinalized}
                  >
                    <Trash2 className="size-4 text-destructive group-hover:scale-105 transition-all " />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
              disabled={
                isFinalized || !form.formState.isValid || items.length === 0
              }
            >
              <CheckCircle className="h-4 w-4" />
              {initialData ? 'Save Changes' : 'Submit Transfer'}
            </Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  )
}
