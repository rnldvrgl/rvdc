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
import { Stock, StockRoomStock } from "@/lib/constants/interface"
import { useDRFToastError } from "@/lib/hooks/useDRFToastError"
import { useStallStockMutations } from "@/lib/mutations/useStallStockMutations"
import { useStockRoomStockMutations } from "@/lib/mutations/useStockRoomStockMutations"
import { formatCurrency, getBadgeVariant } from "@/lib/utils/helpers"
import { PackagePlus } from "lucide-react"
import { useForm } from "react-hook-form"

interface FormValues {
    quantity: string
}

interface RestockFormProps {
    stock: Stock | StockRoomStock
    type: "stall" | "stock_room"
    onClose: () => void
}

export default function RestockForm({
    stock,
    type,
    onClose,
}: RestockFormProps) {
    const form = useForm<FormValues>({ defaultValues: { quantity: "" } })
    const { restockStallStock } = useStallStockMutations()
    const { restockStockRoomStock } = useStockRoomStockMutations()
    const { handleError } = useDRFToastError()

    // determine badge variants safely
    let stallVariant = ""
    let stockRoomVariant = ""

    if (type === "stall" && "status" in stock) {
        stallVariant = getBadgeVariant(stock.status)
    }
    if ("stock_room_status" in stock) {
        stockRoomVariant = getBadgeVariant(stock.stock_room_status)
    }

    const onSubmit = (data: FormValues) => {
        const quantity = parseFloat(data.quantity)
        if (isNaN(quantity) || quantity <= 0) {
            form.setError("quantity", {
                type: "manual",
                message: "Please enter a valid positive number.",
            })
            return
        }

        if (type === "stall" && "stall" in stock) {
            if (quantity > stock.stock_room_quantity) {
                form.setError("quantity", {
                    type: "manual",
                    message: `Cannot exceed stock room available: ${stock.stock_room_quantity}`,
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

            restockStallStock.mutate(
                { stock_id: stock.id, quantity },
                {
                    onSuccess: onClose,
                    onError: (err: unknown) => {
                        handleError(err)
                    },
                },
            )
        } else if (type === "stock_room") {
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

    const unit = stock.item?.unit_of_measure ?? "pcs"
    const isPending =
        restockStallStock.isPending || restockStockRoomStock.isPending

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

                {/* Stock Levels */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {type === "stall" && "stall" in stock && (
                        <>
                            <div>
                                <p className="text-muted-foreground">Stall</p>
                                <p className="font-medium">{stock.stall?.name ?? "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Stall Qty</p>
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
                        </>
                    )}
                    {"stock_room_quantity" in stock && (
                        <div>
                            <p className="text-muted-foreground">Stock Room</p>
                            <div className="flex items-center gap-2">
                                <p className="font-medium">
                                    {stock.stock_room_quantity} {unit}
                                </p>
                                <Badge
                                    variant={stockRoomVariant as BadgeVariant}
                                    className="capitalize"
                                >
                                    {stock.stock_room_status.replace("_", " ")}
                                </Badge>
                            </div>
                        </div>
                    )}
                    {type === "stock_room" && (
                        <div>
                            <p className="text-muted-foreground">Current Qty</p>
                            <p className="font-medium">
                                {stock.quantity} {unit}
                            </p>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Quantity input */}
                <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Quantity to Restock <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder={`Enter quantity (${unit})`}
                                />
                            </FormControl>
                            <FormMessage />
                            {type === "stall" && "stock_room_quantity" in stock && (
                                <p className="text-xs text-muted-foreground">
                                    Available in stock room: {stock.stock_room_quantity} {unit}
                                </p>
                            )}
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
                        <PackagePlus className="mr-2 h-4 w-4" />
                        {isPending ? "Restocking..." : "Restock"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
