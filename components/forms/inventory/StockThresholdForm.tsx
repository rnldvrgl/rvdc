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
import { Stock, StockPayload, StockRoomStock } from '@/lib/constants/interface'
import { useStallStockMutations } from '@/lib/mutations/useStallStockMutations'
import { useStockRoomStockMutations } from '@/lib/mutations/useStockRoomStockMutations'
import { SubmitHandler, useForm } from 'react-hook-form'

interface FormValues {
  low_stock_threshold: string
}

interface StockThresholdFormProps {
  stock: Stock | StockRoomStock
  type: 'stall' | 'stock_room'
  onClose: () => void
}

export default function StockThresholdForm({
  stock,
  type,
  onClose,
}: StockThresholdFormProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      low_stock_threshold: stock?.low_stock_threshold?.toString() ?? '',
    },
  })

  const { updateStallStock } = useStallStockMutations()
  const { updateStockRoomStock } = useStockRoomStockMutations()

  const handleSubmit: SubmitHandler<FormValues> = (data) => {
    const threshold = parseInt(data.low_stock_threshold) || 0

    if (type === 'stall') {
      // Type guard to ensure stock is of type Stock
      if (!('stall' in stock) || !stock.stall?.id) {
        form.setError('root', {
          type: 'required',
          message: 'Stall is required',
        })
        return
      }

      const payload: StockPayload = {
        stall_id: stock.stall.id,
        quantity: stock.quantity,
        low_stock_threshold: threshold,
      }

      updateStallStock.mutate(
        { stock_id: stock.id, data: payload },
        { onSuccess: onClose },
      )
    } else if (type === 'stock_room') {
      // no stall_id needed
      const payload = {
        item_id: stock.item.id,
        quantity: stock.quantity,
        low_stock_threshold: threshold,
      }

      updateStockRoomStock.mutate(
        { stock_id: stock.id, data: payload },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 max-w-md"
      >
        <div className="space-y-4 grid">
          <FormItem>
            <FormLabel>Item</FormLabel>
            <Input
              value={stock.item.name}
              disabled
            />
          </FormItem>

          {type === 'stall' && (
            <>
              <FormItem>
                <FormLabel>Stall</FormLabel>
                <Input
                  value={'stall' in stock ? stock.stall?.name ?? 'N/A' : 'N/A'}
                  disabled
                />
              </FormItem>
              <FormItem>
                <FormLabel>Current Quantity</FormLabel>
                <Input
                  value={stock.quantity.toString()}
                  disabled
                />
              </FormItem>
            </>
          )}

          {type === 'stock_room' && (
            <FormItem>
              <FormLabel>Current Stock Room Quantity</FormLabel>
              <Input
                value={stock.quantity.toString()}
                disabled
              />
            </FormItem>
          )}

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
                    type="number"
                    step="1"
                    min="0"
                    placeholder="e.g. 10"
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
