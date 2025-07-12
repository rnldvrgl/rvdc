'use client'

import { ComboBox } from '@/components/custom/inputs/ComboBox'
import ItemQuantitySelector from '@/components/custom/shared/ItemQuantitySelector'
import PaymentMethodSelector from '@/components/custom/shared/PaymentMethodSelector'
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
import { Item, ItemEntry, SalesTransaction } from '@/lib/constants/interface'
import { Client } from '@/lib/constants/types'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { useItemSelection } from '@/lib/hooks/useItemSelection'
import { useClientChoices, useItemChoices } from '@/lib/queries/useChoices'
import { formatCurrency } from '@/lib/utils/helpers'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import * as z from 'zod'

export const formSchema = z.object({
  stall: z.number().nullable(),
  client_id: z.number().nullable(),
  manual_receipt_number: z.string().optional(),

  payments: z.array(
    z.object({
      payment_type: z.string().min(1, 'Payment type is required'),
      amount: z.number().min(0, 'Amount must be a positive number'),
    }),
  ),

  items: z
    .array(
      z.object({
        item_id: z.number(),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        final_price_per_unit: z.number().min(0),
      }),
    )
    .min(1, 'At least one item is required'),
})

type FormValues = z.infer<typeof formSchema>

const resolver = zodResolver(formSchema)
interface SalesTransactionFormProps {
  initialData?: SalesTransaction
  onClose: () => void
}

export default function SalesTransactionForm({
  initialData,
  onClose,
}: SalesTransactionFormProps) {
  const { assigned_stall } = useCurrentUser()
  const { data: allItemsData } = useItemChoices()
  const { data: clientsData } = useClientChoices()
  const allItems: Item[] = allItemsData ?? []
  const clients: Client[] = clientsData ?? []

  const form = useForm<FormValues>({
    resolver,
    defaultValues: {
      stall: initialData?.stall?.id ?? assigned_stall?.id ?? null,
      client_id: initialData?.client?.id ?? null,
      manual_receipt_number: initialData?.manual_receipt_number ?? '',
      payments: [{ payment_type: '', amount: 0 }],
      items:
        initialData?.items?.map((i) => ({
          item_id: i.item?.id ?? 0,
          quantity: i.quantity ?? 0,
          final_price_per_unit:
            Number(i.final_price_per_unit) ?? Number(i.item?.retail_price) ?? 0,
        })) ?? [],
    },
    mode: 'onChange',
  })

  const { fields, append, remove } = useFieldArray<FormValues, 'payments'>({
    control: form.control,
    name: 'payments',
  })

  const watchedItems = form.watch('items')
  const watchedPayments = form.watch('payments')

  const totalItemsAmount = watchedItems.reduce(
    (acc, i) => acc + i.quantity * i.final_price_per_unit,
    0,
  )
  const totalPayments = watchedPayments.reduce((acc, p) => acc + p.amount, 0)
  const changeDue = totalPayments - totalItemsAmount

  useEffect(() => {
    if (allItemsData && initialData?.items) {
      form.setValue(
        'items',
        initialData.items.map((i) => ({
          item_id: i.item?.id ?? 0,
          quantity: i.quantity ?? 0,
          final_price_per_unit:
            Number(i.final_price_per_unit) ?? Number(i.item?.retail_price) ?? 0,
        })),
      )
    }
  }, [allItemsData, initialData, form])

  const handleSubmit = (data: FormValues) => {
    const payload = {
      stall: assigned_stall?.id ?? null,
      client: data.client_id ?? null,
      manual_receipt_number: data.manual_receipt_number ?? null,
      items: data.items.map((i) => ({
        item: i.item_id,
        quantity: i.quantity,
        final_price_per_unit: i.final_price_per_unit,
      })),
      payments: data.payments.map((p) => ({
        payment_type: p.payment_type,
        amount: p.amount,
      })),
    }

    console.log('Payload:', payload)
    // TODO: send payload to API
    onClose()
  }

  const { items, setItems } = useItemSelection<
    Item,
    ItemEntry,
    SalesTransaction
  >({
    initialData,
    allItems,
    getInitialItems: (data) =>
      data.items?.map((i) => ({
        item: i.item ?? null,
        quantity: i.quantity ?? 0,
      })) ?? [],
  })
  useEffect(() => {
    console.log('Current items:', watchedItems)
  }, [watchedItems])

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="manual_receipt_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manual Receipt #</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. 001245"
                    className="rounded-md"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Client</FormLabel>
                <ComboBox
                  options={clients.map((c) => ({
                    value: c.id,
                    label: `${c.full_name} (${c.contact_number})`,
                  }))}
                  value={field.value ? Number(field.value) : null}
                  onChange={(val) => field.onChange(val ?? null)}
                  placeholder="Select client"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-3">
          <ItemQuantitySelector
            required
            items={items}
            allItems={allItems}
            onChange={(updatedItems) => {
              form.setValue(
                'items',
                updatedItems.map((i) => ({
                  item_id: i.item?.id ?? 0,
                  quantity: i.quantity,
                  final_price_per_unit:
                    i.final_price_per_unit ?? Number(i.item?.retail_price) ?? 0,
                })),
              )
              setItems(updatedItems)
            }}
            allowPriceChange
          />
          <FormMessage>{form.formState.errors.items?.message}</FormMessage>
        </div>

        <div className="grid gap-3">
          <PaymentMethodSelector
            control={form.control}
            fields={fields}
            append={append}
            remove={remove}
          />

          <FormMessage>{form.formState.errors.payments?.message}</FormMessage>
        </div>

        <div className="border-t pt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Items:</span>
            <span className="font-semibold text-base">
              {formatCurrency(totalItemsAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payments:</span>
            <span className="font-semibold text-base text-primary">
              {formatCurrency(totalPayments)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Change / Due:</span>
            <span
              className={`font-semibold text-base ${
                changeDue >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-destructive'
              }`}
            >
              {formatCurrency(changeDue)}
            </span>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          disabled={!form.formState.isDirty || form.formState.isSubmitting}
        >
          {initialData ? 'Update Transaction' : 'Create Transaction'}
        </Button>
      </form>
    </Form>
  )
}
