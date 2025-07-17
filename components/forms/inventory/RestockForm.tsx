'use client'

import { Badge, BadgeVariant } from '@/components/ui/badge'
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
import { Stock, StockRoomStock } from '@/lib/constants/interface'
import { useDRFToastError } from '@/lib/hooks/useDRFToastError'
import { useStallStockMutations } from '@/lib/mutations/useStallStockMutations'
import { useStockRoomStockMutations } from '@/lib/mutations/useStockRoomStockMutations'
import { formatCurrency, getBadgeVariant } from '@/lib/utils/helpers'
import { Package, Store, Warehouse } from 'lucide-react'
import { useForm } from 'react-hook-form'

interface FormValues {
  quantity: string
}

interface RestockFormProps {
  stock: Stock | StockRoomStock
  type: 'stall' | 'stock_room'
  onClose: () => void
}

export default function RestockForm({
  stock,
  type,
  onClose,
}: RestockFormProps) {
  const form = useForm<FormValues>({ defaultValues: { quantity: '' } })
  const { restockStallStock } = useStallStockMutations()
  const { restockStockRoomStock } = useStockRoomStockMutations()
  const { handleError } = useDRFToastError()

  // determine badge variants safely
  let stallVariant = ''
  let stockRoomVariant = ''

  if (type === 'stall' && 'status' in stock) {
    stallVariant = getBadgeVariant(stock.status)
  }
  if ('stock_room_status' in stock) {
    stockRoomVariant = getBadgeVariant(stock.stock_room_status)
  }

  const onSubmit = (data: FormValues) => {
    const quantity = parseInt(data.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      form.setError('quantity', {
        type: 'manual',
        message: 'Please enter a valid positive number.',
      })
      return
    }

    if (type === 'stall' && 'stall' in stock) {
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
          onError: (err: unknown) => {
            handleError(err)
          },
        },
      )
    } else if (type === 'stock_room') {
      restockStockRoomStock.mutate(
        { stock_id: stock.id, quantity },
        {
          onSuccess: onClose,
          onError: (err: unknown) => {
            handleError(err)
          },
        },
      )
    }
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
        {type === 'stall' && 'stall' in stock && (
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
                  variant={stallVariant as BadgeVariant}
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
        )}

        {/* Stock room */}
        {'stock_room_quantity' in stock && (
          <Card>
            <CardContent className="px-6 space-y-1">
              <div className="flex items-center gap-1 font-semibold text-primary text-base">
                <Warehouse size={16} /> Stock Room
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">Available:</span>{' '}
                {stock.stock_room_quantity}
                <Badge
                  variant={stockRoomVariant as BadgeVariant}
                  className="capitalize"
                >
                  {stock.stock_room_status.replace('_', ' ')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

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
