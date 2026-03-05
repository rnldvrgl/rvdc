"use client"

import { Badge, BadgeVariant } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Stock } from "@/lib/constants/interface"
import { useDRFToastError } from "@/lib/hooks/useDRFToastError"
import { useStallStockMutations } from "@/lib/mutations/useStallStockMutations"
import { formatCurrency, getBadgeVariant } from "@/lib/utils/helpers"
import { Package, Store } from "lucide-react"
import { useForm } from "react-hook-form"

interface FormValues {
  quantity: string
}

interface AddStockFormProps {
  stock: Stock
  onClose: () => void
}

export default function AddStockForm({ stock, onClose }: AddStockFormProps) {
  const form = useForm<FormValues>({ defaultValues: { quantity: "" } })
  const { addStallStock } = useStallStockMutations()
  const { handleError } = useDRFToastError()

  const stallVariant = getBadgeVariant(stock.status)

  const onSubmit = (data: FormValues) => {
    const quantity = parseFloat(data.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      form.setError("quantity", {
        type: "manual",
        message: "Please enter a valid positive number.",
      })
      return
    }

    if (!stock.stall?.id) {
      form.setError("quantity", {
        type: "manual",
        message: "Stall information is missing.",
      })
      return
    }

    addStallStock.mutate(
      { stock_id: stock.id, quantity },
      {
        onSuccess: onClose,
        onError: (err: unknown) => {
          handleError(err)
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
              <span className="text-muted-foreground">Name:</span>{" "}
              {stock.item?.display_name ?? "N/A"}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Category:</span>{" "}
              {stock.item?.category?.name ?? "N/A"}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Price:</span>{" "}
              {formatCurrency(stock.item?.retail_price ?? 0)}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Unit:</span>{" "}
              {stock.item?.unit_of_measure ?? "pcs"}
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
              <span className="text-muted-foreground">Stall:</span>{" "}
              {stock.stall?.name ?? "N/A"}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Quantity:</span>{" "}
              {stock.quantity}
              <Badge
                variant={stallVariant as BadgeVariant}
                className="capitalize"
              >
                {stock.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Low Threshold:</span>{" "}
              {stock.low_stock_threshold}
            </div>
          </CardContent>
        </Card>

        {/* Quantity Input */}
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Quantity to Add <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  {...field}
                  min={0.01}
                  step={0.01}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                This will directly add stock to the stall without deducting from
                stock room (temporary feature).
              </p>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={addStallStock.isPending}
          >
            {addStallStock.isPending ? "Adding..." : "Add Stock"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
