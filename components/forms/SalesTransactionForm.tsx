'use client'

import ItemQuantitySelector from '@/components/custom/shared/ItemQuantitySelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Item, SalesTransaction } from '@/lib/constants/interface'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { useItemSelection } from '@/lib/hooks/useItemSelection'
import { useItemChoices } from '@/lib/queries/useChoices'
import { SubmitHandler, useForm } from 'react-hook-form'

interface FormValues {
  stall: string
  client_name?: string
  manual_receipt_number?: string
  date?: string
}

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
  const allItems: Item[] = allItemsData ?? []

  const form = useForm<FormValues>({
    defaultValues: {
      stall:
        initialData?.stall?.id?.toString() ?? assigned_stall?.id?.toString(),
      client_name: initialData?.client?.full_name ?? '',
      manual_receipt_number: initialData?.manual_receipt_number ?? '',
      date: initialData?.created_at
        ? new Date(initialData.created_at).toISOString().substring(0, 10)
        : new Date().toISOString().substring(0, 10),
    },
  })

  const { items, setItems } = useItemSelection<Item, SalesTransaction>({
    initialData,
    allItems,
    getInitialItems: (data) =>
      data.items?.map((i) => ({
        item: i.item ?? null,
        quantity: i.quantity ?? 0,
      })) ?? [],
  })

  const handleSubmit: SubmitHandler<FormValues> = (data) => {
    const payload = {
      stall_id: parseInt(data.stall),
      client_name: data.client_name || null,
      manual_receipt_number: data.manual_receipt_number || null,
      date: data.date,
    }
    console.log('Payload:', payload)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 max-w-3xl mx-auto"
      >
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Sales Transaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-2">
              <h3 className="font-semibold text-muted-foreground mb-2 text-sm uppercase tracking-wider">
                Items
              </h3>
              <ItemQuantitySelector
                items={items}
                allItems={allItems}
                onChange={setItems}
                allowPriceChange
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="submit"
            className="rounded-xl"
          >
            {initialData ? 'Update Transaction' : 'Create Transaction'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
