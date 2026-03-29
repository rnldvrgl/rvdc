"use client"

import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
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
import { getBadgeVariant } from "@/lib/utils/helpers"
import { PackageMinus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

interface FormValues {
  quantity: string
}

interface PullOutFormProps {
  stock: Stock
  onClose: () => void
}

export default function PullOutForm({ stock, onClose }: PullOutFormProps) {
  const form = useForm<FormValues>({
    defaultValues: { quantity: "" },
  })
  const { pullOutStallStock } = useStallStockMutations()
  const { handleError } = useDRFToastError()
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingData, setPendingData] = useState<{
    quantity: number
  } | null>(null)

  const stallVariant = getBadgeVariant(stock.status)
  const unit = stock.item?.unit_of_measure ?? "pcs"

  const onSubmit = (data: FormValues) => {
    const quantity = parseFloat(data.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      form.setError("quantity", {
        type: "manual",
        message: "Please enter a valid positive number.",
      })
      return
    }

    if (quantity > stock.available_quantity) {
      form.setError("quantity", {
        type: "manual",
        message: `Cannot exceed available quantity (${stock.available_quantity} ${unit}).`,
      })
      return
    }

    setPendingData({ quantity })
    setShowConfirm(true)
  }

  const handleConfirm = () => {
    if (!pendingData) return
    setShowConfirm(false)
    pullOutStallStock.mutate(
      {
        stock_id: stock.id,
        quantity: pendingData.quantity,
      },
      {
        onSuccess: onClose,
        onError: (err: unknown) => {
          handleError(err)
        },
      },
    )
  }

  return (
    <>
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
              <p className="font-medium">
                {stock.item?.category?.name ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Stall</p>
              <p className="font-medium">{stock.stall?.name ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Unit</p>
              <p className="font-medium">{unit}</p>
            </div>
          </div>

          <Separator />

          {/* Current Stock */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
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
            <div>
              <p className="text-muted-foreground">Available</p>
              <p className="font-medium">
                {stock.available_quantity} {unit}
              </p>
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
                  Quantity to Pull Out{" "}
                  <span className="text-destructive">*</span>
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
              </FormItem>
            )}
          />

          <p className="text-xs text-muted-foreground">
            Stock will be deducted from this stall.
          </p>

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
              variant="destructive"
              className="flex-1"
              disabled={pullOutStallStock.status === "pending"}
            >
              <PackageMinus className="mr-2 size-4" />
              {pullOutStallStock.status === "pending"
                ? "Processing..."
                : "Pull Out"}
            </Button>
          </div>
        </form>
      </Form>
      <ConfirmDialog
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title="Confirm Pull Out"
        description={`Are you sure you want to pull out ${pendingData?.quantity ?? ""} ${unit} of "${stock.item?.display_name ?? "this item"}" from ${stock.stall?.name ?? "this stall"}?`}
        confirmText="Pull Out"
        Icon={PackageMinus}
        variant="warning"
      />
    </>
  )
}
