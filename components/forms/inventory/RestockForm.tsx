'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { formatCurrency, getStockBadgeVariant } from '@/lib/utils/helpers'
import { Package, Store, Warehouse } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface FormValues {
  quantity: string
}

interface RestockFormProps {
  stock: Stock
  onClose: () => void
}

export default function RestockForm({ stock, onClose }: RestockFormProps) {
  const form = useForm<FormValues>({ defaultValues: { quantity: '' } })
  const { restockStallStock } = useStallStockMutations()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const stallVariant = getStockBadgeVariant(stock.status)
  const stockRoomStatus =
    stock.stock_room_quantity === 0
      ? 'no_stock'
      : stock.stock_room_quantity <= 5
      ? 'low_stock'
      : 'high_stock'
  const stockRoomVariant = getStockBadgeVariant(stockRoomStatus)

  const onSubmit = (data: FormValues) => {
    setSubmitError(null)
    const quantity = parseInt(data.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      form.setError('quantity', {
        type: 'manual',
        message: 'Please enter a valid positive number.',
      })
      return
    }
    if (quantity > stock.stock_room_quantity) {
      form.setError('quantity', {
        type: 'manual',
        message: `Cannot exceed stock room available: ${stock.stock_room_quantity}`,
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
      { stock_id: stock.id, quantity },
      {
        onSuccess: onClose,
        onError: (err: any) => {
          setSubmitError(
            err?.response?.data?.non_field_errors?.join(', ') ||
              'Restock failed. Please try again.',
          )
        },
      },
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Item */}
        <Card>
          <CardContent className="px-6 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-primary text-base">
              <Package size={16} /> Item Details
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Name:</span>{' '}
              {stock.item?.display_name ?? 'N/A'}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Category:</span>{' '}
              {stock.item?.category?.name ?? 'N/A'}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Price:</span>{' '}
              {formatCurrency(stock.item?.retail_price ?? 0)}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Unit:</span>{' '}
              {stock.item?.unit_of_measure ?? 'pcs'}
            </div>
          </CardContent>
        </Card>

        {/* Stall */}
        <Card>
          <CardContent className="px-6 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-primary text-base">
              <Store size={16} /> Stall Stock
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Stall:</span>{' '}
              {stock.stall?.name ?? 'N/A'}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Quantity:</span>{' '}
              {stock.quantity}
              <Badge
                variant={stallVariant}
                className="capitalize"
              >
                {stock.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Low Threshold:</span>{' '}
              {stock.low_stock_threshold}
            </div>
          </CardContent>
        </Card>

        {/* Stock room */}
        <Card>
          <CardContent className="px-6 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-primary text-base">
              <Warehouse size={16} /> Stock Room
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Available:</span>{' '}
              {stock.stock_room_quantity}
              <Badge
                variant={stockRoomVariant}
                className="capitalize"
              >
                {stockRoomStatus.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quantity input */}
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Quantity to add</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                    className="text-sm"
                  />
                </FormControl>
                <FormMessage className="text-sm" />
              </FormItem>
            )}
          />
          {submitError && (
            <div className="text-red-500 text-sm">{submitError}</div>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            type="submit"
          >
            Restock
          </Button>
        </div>
      </form>
    </Form>
  )
}
