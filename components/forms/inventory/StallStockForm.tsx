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
import { Stock, StockPayload } from '@/lib/constants/interface'
import { useStallStockMutations } from '@/lib/mutations/useStallStockMutations'
import { SubmitHandler, useForm } from 'react-hook-form'

interface FormValues {
  low_stock_threshold: string
}

interface StallStockFormProps {
  stock: Stock
  onClose: () => void
}

export default function StallStockForm({
  stock,
  onClose,
}: StallStockFormProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      low_stock_threshold: stock?.low_stock_threshold?.toString() ?? '',
    },
  })

  const { updateStallStock } = useStallStockMutations()

  const handleSubmit: SubmitHandler<FormValues> = (data) => {
    const payload: StockPayload = {
      item_id: stock.item.id,
      stall_id: stock.stall?.id,
      quantity: stock.quantity, // keep current quantity
      low_stock_threshold: data.low_stock_threshold
        ? parseInt(data.low_stock_threshold)
        : undefined,
    }

    if (stock.stall?.id === undefined) {
      form.setError('root', {
        type: 'required',
        message: 'Stall is required',
      })
      return
    }
    updateStallStock.mutate(
      { stall_id: stock.stall.id, stock_id: stock.id, data: payload },
      { onSuccess: onClose },
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 max-w-md"
      >
        <div className="space-y-4 grid">
          {/* Item (readonly) */}
          <FormItem>
            <FormLabel>Item</FormLabel>
            <Input
              value={stock.item.name}
              disabled
            />
          </FormItem>

          {/* Stall (readonly) */}
          <FormItem>
            <FormLabel>Stall</FormLabel>
            <Input
              value={stock.stall?.name}
              disabled
            />
          </FormItem>

          {/* Current quantity (readonly) */}
          <FormItem>
            <FormLabel>Current Quantity</FormLabel>
            <Input
              value={stock.quantity.toString()}
              disabled
            />
          </FormItem>

          {/* Low stock threshold (editable) */}
          <FormField
            control={form.control}
            name="low_stock_threshold"
            rules={{ required: 'Low stock threshold is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Low Stock Threshold</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. 10"
                    type="number"
                    step="1"
                    min="0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit">Update Threshold</Button>
        </div>
      </form>
    </Form>
  )
}
