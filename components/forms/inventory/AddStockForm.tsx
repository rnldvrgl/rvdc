"use client"

import { Badge, BadgeVariant } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Stock } from "@/lib/constants/interface"
import { useDRFToastError } from "@/lib/hooks/useDRFToastError"
import { useStallStockMutations } from "@/lib/mutations/useStallStockMutations"
import { formatCurrency, getBadgeVariant } from "@/lib/utils/helpers"
import { PackagePlus } from "lucide-react"
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

  const unit = stock.item?.unit_of_measure ?? "pcs"

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
      >
        {/* Item Info */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-muted-foreground">Item</p>
            <p className="font-medium">{stock.item?.display_name ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Category</p>
            <p className="font-medium">{stock.item?.category?.name ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Price</p>
            <p className="font-medium">
              {formatCurrency(stock.item?.retail_price ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Unit</p>
            <p className="font-medium">{unit}</p>
          </div>
        </div>

        <Separator />

        {/* Stall Info */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-muted-foreground">Stall</p>
            <p className="font-medium">{stock.stall?.name ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Current Qty</p>
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {stock.quantity} {unit}
              </p>
              <Badge
                variant={stallVariant as BadgeVariant}
                className="capitalize"
              >
                {stock.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

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
                  placeholder={`Enter quantity (${unit})`}
                  {...field}
                  min={0.01}
                  step="any"
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                This will directly add stock to the stall without deducting from
                stock room.
              </p>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-2 pt-2">
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
            <PackagePlus className="mr-2 h-4 w-4" />
            {addStallStock.isPending ? "Adding..." : "Add Stock"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
