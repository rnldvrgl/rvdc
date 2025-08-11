'use client'

import ItemQuantitySelector from '@/components/custom/shared/ItemQuantitySelector'
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
import type {
  Item,
  ItemEntry,
  Stall,
  StockTransfer,
} from '@/lib/constants/interface'
import type { Technician } from '@/lib/constants/types'
import { useItemSelection } from '@/lib/hooks/useItemSelection'
import { useStockTransferMutations } from '@/lib/mutations/useStockTransferMutations'
import {
  useItemChoices,
  useStallChoices,
  useTechnicianChoices,
} from '@/lib/queries/useChoices'
import useUserProfileStore from '@/lib/store/useUserProfileStore'
import { formatDate } from '@/lib/utils/helpers/date'
import { CheckCircle } from 'lucide-react'
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

  const { items, setItems } = useItemSelection<Item, ItemEntry, StockTransfer>({
    initialData,
    allItems,
    getInitialItems: (data) =>
      data.items?.map((i) => ({
        item: i.item ?? null,
        quantity: i.quantity ?? 0,
      })) ?? [],
  })

  const handleSubmit = (values: FormValues) => {
    const payload = {
      from_stall: user?.assigned_stall?.id,
      to_stall: parseInt(values.to_stall ?? '0'),
      technician: parseInt(values.technician ?? '0'),
      used_for: values.used_for,
      items: items.map((itm) => ({
        item: itm.item?.id,
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
                            {tech.first_name} {tech.last_name}
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
            <ItemQuantitySelector
              items={items}
              allItems={allItems}
              onChange={setItems}
            />
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
