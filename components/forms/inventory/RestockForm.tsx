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
import { Stock } from '@/lib/constants/interface'
import { useStallStockMutations } from '@/lib/mutations/useStallStockMutations'
import { useForm } from 'react-hook-form'

interface FormValues {
  quantity: string
}

interface RestockFormProps {
  stock: Stock
  onClose: () => void
}

export default function RestockForm({ stock, onClose }: RestockFormProps) {
  const form = useForm<FormValues>({
    defaultValues: { quantity: '' },
  })

  const { restockStallStock } = useStallStockMutations()

  const onSubmit = (data: FormValues) => {
    const quantity = parseInt(data.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      form.setError('quantity', {
        type: 'manual',
        message: 'Please enter a valid positive number.',
      })
      return
    }

    if (!stock.stall?.id) {
      form.setError('quantity', {
        type: 'manual',
        message: 'Stall information is missing.',
      })
      return
    }

    restockStallStock.mutate(
      {
        stock_id: stock.id,
        stall_id: stock.stall.id,
        quantity,
      },
      {
        onSuccess: onClose,
      },
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-md"
      >
        <div className="space-y-4 grid">
          <div>
            <div className="font-semibold">{stock.item.display_name}</div>
            <div className="text-sm text-muted-foreground">
              Current stock: {stock.quantity}
            </div>
            {stock.stall && (
              <div className="text-sm text-muted-foreground">
                Stall: <span className="font-medium">{stock.stall.name}</span>
              </div>
            )}
          </div>

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity to add</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit">Restock</Button>
        </div>
      </form>
    </Form>
  )
}
