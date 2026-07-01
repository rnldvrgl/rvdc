"use client"

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
import { Switch } from "@/components/ui/switch"
import { Stock, StockPayload, StockRoomStock } from "@/lib/constants/interface"
import { useStallStockMutations } from "@/lib/mutations/useStallStockMutations"
import { useStockRoomStockMutations } from "@/lib/mutations/useStockRoomStockMutations"
import { Save } from "lucide-react"
import { SubmitHandler, useForm } from "react-hook-form"

interface FormValues {
    low_stock_threshold: string
    track_stock: boolean
}

interface StockThresholdFormProps {
    stock: Stock | StockRoomStock
    type: "stall" | "stock_room"
    onClose: () => void
}

export default function StockThresholdForm({
    stock,
    type,
    onClose,
}: StockThresholdFormProps) {
    const isStallStock = "stall" in stock
    const form = useForm<FormValues>({
        defaultValues: {
            low_stock_threshold: stock?.low_stock_threshold?.toString() ?? "",
            track_stock: isStallStock ? (stock as Stock).track_stock !== false : true,
        },
    })

    const { updateStallStock } = useStallStockMutations()
    const { updateStockRoomStock } = useStockRoomStockMutations()

    const handleSubmit: SubmitHandler<FormValues> = (data) => {
        const threshold = parseFloat(data.low_stock_threshold) || 0

        if (type === "stall") {
            // Type guard to ensure stock is of type Stock
            if (!("stall" in stock) || !stock.stall?.id) {
                form.setError("root", {
                    type: "required",
                    message: "Stall is required",
                })
                return
            }

            const payload: StockPayload = {
                stall_id: stock.stall.id,
                quantity: stock.quantity,
                low_stock_threshold: threshold,
                track_stock: data.track_stock,
            }

            updateStallStock.mutate(
                { stock_id: stock.id, data: payload },
                { onSuccess: onClose },
            )
        } else if (type === "stock_room") {
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

    const unit = stock.item?.unit_of_measure ?? "pcs"
    const isPending = updateStallStock.isPending || updateStockRoomStock.isPending

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-5"
            >
                {/* Info */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                        <p className="text-muted-foreground">Item</p>
                        <p className="font-medium">
                            {stock.item?.display_name ?? stock.item.name}
                        </p>
                    </div>
                    {type === "stall" && "stall" in stock && (
                        <div>
                            <p className="text-muted-foreground">Stall</p>
                            <p className="font-medium">{stock.stall?.name ?? "N/A"}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-muted-foreground">Current Qty</p>
                        <p className="font-medium">
                            {stock.quantity} {unit}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Current Threshold</p>
                        <p className="font-medium">
                            {stock.low_stock_threshold} {unit}
                        </p>
                    </div>
                </div>

                <Separator />

                {/* Track Stock Toggle */}
                {type === "stall" && (
                    <FormField
                        control={form.control}
                        name="track_stock"
                        render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-sm font-medium">
                                        Track Stock
                                    </FormLabel>
                                    <p className="text-xs text-muted-foreground">
                                        {field.value
                                            ? "Stock levels are tracked. Reservations and deductions apply."
                                            : "Untracked — no stock operations, reservations, or deductions."}
                                    </p>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                )}

                {/* Threshold Input */}
                <FormField
                    control={form.control}
                    name="low_stock_threshold"
                    rules={{ required: "Low stock threshold is required" }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                New Low Stock Threshold{" "}
                                <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder={`e.g. 10 (${unit})`}
                                />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground">
                                You will be alerted when stock falls below this level.
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
                        disabled={isPending}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {isPending ? "Saving..." : "Update Threshold"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
