"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Item,
  ItemPayload,
  ItemPriceHistory,
  ProductCategory,
} from "@/lib/constants/interface"
import { useItemMutations } from "@/lib/mutations/useItemMutations"
import { useCategoryChoices } from "@/lib/queries/useChoices"
import { formatCurrency } from "@/lib/utils/helpers"
import { format } from "date-fns"
import { ArrowDown, ArrowUp, History, Minus } from "lucide-react"
import { SubmitHandler, useForm } from "react-hook-form"

interface FormValues {
  name: string
  category: string | null
  unit_of_measure: "pcs" | "ft" | "kg" | "roll" | "box"
  retail_price: string
  wholesale_price: string
  technician_price: string
  cost_price: string
  waste_tolerance_percentage: string
}

interface ItemFormProps {
  item?: Item
  onClose: () => void
}

function PriceHistoryTimeline({ history }: { history: ItemPriceHistory[] }) {
  if (!history || history.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="relative space-y-0 pl-5">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />

        {history.slice(0, 15).map((entry) => {
          const changeAmount = entry.price_change_amount
            ? parseFloat(entry.price_change_amount)
            : null
          const isUp = changeAmount !== null && changeAmount > 0
          const isDown = changeAmount !== null && changeAmount < 0
          const isInitial = entry.change_type === "initial"

          return (
            <div
              key={entry.id}
              className="relative flex gap-3 pb-4 last:pb-0"
            >
              <div
                className={`absolute -left-[13px] top-1.5 z-10 size-3 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm ${
                  isInitial
                    ? "bg-sky-500"
                    : isUp
                      ? "bg-rose-500"
                      : isDown
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {formatCurrency(entry.retail_price)}
                  </span>
                  {changeAmount !== null && !isInitial && (
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm ${
                        isUp
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      }`}
                    >
                      {isUp ? (
                        <ArrowUp className="h-2.5 w-2.5" />
                      ) : isDown ? (
                        <ArrowDown className="h-2.5 w-2.5" />
                      ) : (
                        <Minus className="h-2.5 w-2.5" />
                      )}
                      {formatCurrency(Math.abs(changeAmount))}
                    </span>
                  )}
                  {isInitial && (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Initial
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                  <span>W: {formatCurrency(entry.wholesale_price)}</span>
                  <span>·</span>
                  <span>T: {formatCurrency(entry.technician_price)}</span>
                  <span>·</span>
                  <span>C: {formatCurrency(entry.cost_price)}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {format(new Date(entry.changed_at), "MMM d, yyyy h:mm a")}
                  {entry.notes && (
                    <span className="text-slate-400 dark:text-slate-500">
                      {" · "}
                      {entry.notes}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ItemForm({ item, onClose }: ItemFormProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      name: item?.name ?? "",
      category: item?.category?.id ? item.category.id.toString() : null,
      unit_of_measure: item?.unit_of_measure ?? "pcs",
      retail_price: item?.retail_price?.toString() ?? "",
      wholesale_price: item?.wholesale_price?.toString() ?? "",
      technician_price: item?.technician_price?.toString() ?? "",
      cost_price: item?.cost_price?.toString() ?? "",
      waste_tolerance_percentage:
        item?.waste_tolerance_percentage?.toString() ?? "0",
    },
  })

  const { data: categoriesData, isLoading: loadingCategories } =
    useCategoryChoices()
  const categories = categoriesData ?? []

  const { addItem, updateItem } = useItemMutations()

  const handleSubmit: SubmitHandler<FormValues> = (data) => {
    const payload: ItemPayload = {
      name: data.name,
      category_id: data.category ? parseInt(data.category) : null,
      unit_of_measure: data.unit_of_measure,
      retail_price: parseFloat(data.retail_price) || 0,
      wholesale_price: parseFloat(data.wholesale_price) || 0,
      technician_price: parseFloat(data.technician_price) || 0,
      cost_price: parseFloat(data.cost_price) || 0,
      waste_tolerance_percentage:
        parseFloat(data.waste_tolerance_percentage) || 0,
    }

    if (item?.id) {
      updateItem.mutate({ id: item.id, data: payload }, { onSuccess: onClose })
    } else {
      addItem.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6 max-w-md"
        >
          <div className="space-y-4 grid">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Electrical Wire"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              rules={{ required: "Category is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Category</FormLabel>
                  <FormControl>
                    <ComboBox
                      options={categories.map((cat: ProductCategory) => ({
                        label: cat.name,
                        value: cat.id.toString(),
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={
                        loadingCategories ? "Loading..." : "Select Category"
                      }
                      disabled={loadingCategories}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit_of_measure"
              rules={{ required: "Unit is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Unit of Measure</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pieces</SelectItem>
                        <SelectItem value="ft">Feet</SelectItem>
                        <SelectItem value="kg">Kilogram</SelectItem>
                        <SelectItem value="roll">Roll</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cost Price */}
            <div className="space-y-4 grid">
              <FormField
                control={form.control}
                name="cost_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Cost Price</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. 100.00"
                        type="number"
                        step="1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Retail Price */}
            <FormField
              control={form.control}
              name="retail_price"
              rules={{ required: "Retail Price is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Retail Price</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. 150.00"
                      type="number"
                      step="1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* WholeSale Price */}
          <div className="space-y-4 grid">
            <FormField
              control={form.control}
              name="wholesale_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Wholesale Price</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. 100.00"
                      type="number"
                      step="1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Technician Price */}
          <div className="space-y-4 grid">
            <FormField
              control={form.control}
              name="technician_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Technician Price</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. 100.00"
                      type="number"
                      step="1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Waste Tolerance — only relevant for continuous units like kg, ft */}
          <div className="space-y-4 grid">
            <FormField
              control={form.control}
              name="waste_tolerance_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Waste Tolerance %</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. 5 for 5%"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Acceptable loss when dispensing (e.g. freon, copper tubes).
                    Set 0 for items with no expected waste.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit">{item ? "Update Item" : "Add Item"}</Button>
          </div>
        </form>
      </Form>

      {item && item.price_history && item.price_history.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4" />
              Price History
              <Badge
                variant="secondary"
                className="text-xs"
              >
                {item.price_history.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PriceHistoryTimeline history={item.price_history} />
          </CardContent>
        </Card>
      )}
    </>
  )
}
