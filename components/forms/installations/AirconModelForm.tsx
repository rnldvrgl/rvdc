"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { Resolver, useForm, useWatch } from "react-hook-form"

import { AirconModelPayload } from "@/lib/constants/infers"
import { AirconModels, ModelPriceHistory } from "@/lib/constants/interface"
import { AirconModelSchema, DiscountOnlySchema } from "@/lib/constants/schema"
import { useAirconModelMutations } from "@/lib/mutations/installations/useAirconModelMutations"
import {
  useAirconBrandsChoices,
  useAirconTypesChoices,
  useHorsePowerChoices,
} from "@/lib/queries/useChoices"
import { formatCurrency } from "@/lib/utils/helpers"
import { format } from "date-fns"
import {
  ArrowDown,
  ArrowUp,
  History,
  Minus,
  Percent,
  Settings2,
  Shield,
  Tag,
} from "lucide-react"

interface Props {
  initialData?: AirconModels
  isAddingDiscount?: boolean
  onClose: () => void
}

const clampDiscount = (value?: number | string) => {
  const n =
    value === "" || value === undefined ? undefined : Math.floor(Number(value))
  if (n === undefined || Number.isNaN(n)) return undefined
  return Math.min(Math.max(n, 0), 100)
}

/* --------------- Price History Timeline --------------- */
function PriceHistoryTimeline({ history }: { history: ModelPriceHistory[] }) {
  if (!history || history.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="relative space-y-0 pl-5">
        {/* Timeline line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />

        {history.slice(0, 10).map((entry) => {
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
              {/* Dot */}
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
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {formatCurrency(entry.retail_price)}
                  </span>
                  {parseFloat(entry.discount_percentage) > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ({entry.discount_percentage}% off →{" "}
                      {formatCurrency(entry.effective_price)})
                    </span>
                  )}
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

/* --------------- Promo Price Preview --------------- */
function PromoPricePreview({
  retailPrice,
  discount,
}: {
  retailPrice: string | undefined
  discount: number | undefined
}) {
  const promoPrice =
    retailPrice && discount !== undefined && discount > 0
      ? Number(retailPrice) * (1 - Number(discount) / 100)
      : undefined

  if (!promoPrice || promoPrice <= 0) return null

  return (
    <div className="flex items-center justify-between rounded-lg border-2 border-emerald-300 bg-emerald-50 px-4 py-3">
      <span className="text-sm font-semibold text-emerald-800">
        Promo Price
      </span>
      <span className="text-lg font-bold text-emerald-700">
        {formatCurrency(promoPrice.toFixed(2))}
      </span>
    </div>
  )
}

/* --------------- Main Form --------------- */
export default function AirconModelForm({
  initialData,
  isAddingDiscount,
  onClose,
}: Props) {
  const isEditing = !!initialData
  const { addModel, updateModel } = useAirconModelMutations()
  const { data: airconTypes } = useAirconTypesChoices()
  const { data: airconBrands } = useAirconBrandsChoices()
  const { data: horsePowerOptions } = useHorsePowerChoices()

  const form = useForm<AirconModelPayload>({
    resolver: zodResolver(
      isAddingDiscount ? DiscountOnlySchema : AirconModelSchema,
    ) as unknown as Resolver<AirconModelPayload>,
    defaultValues: {
      brand_id: initialData?.brand?.id ?? undefined,
      name: initialData?.name ?? "",
      retail_price: initialData?.retail_price ?? "",
      cost_price: initialData?.cost_price ?? "",
      discount_percentage:
        initialData?.discount_percentage !== undefined
          ? Number(initialData.discount_percentage)
          : undefined,
      aircon_type: initialData?.aircon_type ?? undefined,
      horsepower: initialData?.horsepower ?? undefined,
      is_inverter: initialData?.is_inverter ?? false,
      parts_warranty_months: initialData?.parts_warranty_months ?? 60,
      labor_warranty_months: initialData?.labor_warranty_months ?? 12,
    },
    mode: "onSubmit",
  })

  const { handleSubmit, control } = form
  const retailPrice = useWatch({ control, name: "retail_price" })
  const discount = useWatch({ control, name: "discount_percentage" })

  const handleFormSubmit = (data: AirconModelPayload) => {
    const payload: Partial<AirconModels> = {
      ...data,
      discount_percentage: data.discount_percentage?.toString(),
    }

    if (isAddingDiscount && initialData) {
      updateModel.mutate(
        { id: initialData.id, data: payload },
        { onSuccess: onClose },
      )
      return
    }

    if (isEditing && initialData) {
      updateModel.mutate(
        { id: initialData.id, data: payload },
        { onSuccess: onClose },
      )
    } else {
      addModel.mutate(payload as Omit<AirconModels, "id">, {
        onSuccess: onClose,
      })
    }
  }

  // Discount-only mode
  if (isAddingDiscount) {
    return (
      <Form {...form}>
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-6"
        >
          {initialData && (
            <Card>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {initialData.brand?.name}
                  </p>
                  <p className="text-base font-semibold">{initialData.name}</p>
                </div>
                <p className="text-lg font-bold">
                  {formatCurrency(initialData.retail_price)}
                </p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="size-5" />
                Apply Discount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={control}
                name="discount_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Percentage</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="number"
                          step={1}
                          min={0}
                          max={100}
                          className="pl-10 h-11"
                          placeholder="0"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const clamped = clampDiscount(e.target.value)
                            e.target.value = clamped?.toString() ?? ""
                            field.onChange(clamped)
                          }}
                          onBlur={(e) => {
                            const clamped = clampDiscount(e.target.value)
                            e.target.value = clamped?.toString() ?? ""
                            field.onChange(clamped)
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <PromoPricePreview
                retailPrice={retailPrice}
                discount={discount}
              />
            </CardContent>
          </Card>
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="min-w-32"
            >
              {initialData?.discount_percentage
                ? "Update Discount"
                : "Apply Discount"}
            </Button>
          </div>
        </form>
      </Form>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Form {...form}>
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-8"
        >
          {/* ── Card: Model Identity ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="size-5" />
                Model Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="brand_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Brand</FormLabel>
                      <FormControl>
                        <ComboBox
                          value={field.value ?? null}
                          onChange={(val) => field.onChange(val ?? undefined)}
                          options={
                            airconBrands?.map((b) => ({
                              value: b.id,
                              label: b.name,
                            })) ?? []
                          }
                          placeholder="Select brand"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Model Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-11"
                          placeholder="e.g., Split Type X123"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Card: Specifications ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="size-5" />
                Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="aircon_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Aircon Type</FormLabel>
                      <FormControl>
                        <ComboBox
                          value={field.value ?? null}
                          onChange={(val) => field.onChange(val ?? undefined)}
                          options={
                            airconTypes?.map((t) => ({
                              value: t.value,
                              label: t.label,
                            })) ?? []
                          }
                          placeholder="Select type"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="horsepower"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horsepower</FormLabel>
                      <FormControl>
                        <ComboBox
                          value={field.value ?? null}
                          onChange={(val) => field.onChange(val ?? undefined)}
                          options={
                            horsePowerOptions?.map((hp) => ({
                              value: hp.value,
                              label: hp.label,
                            })) ?? []
                          }
                          placeholder="Select HP"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={control}
                name="is_inverter"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        Inverter Technology
                      </FormLabel>
                      <FormDescription>
                        This unit uses inverter compressor technology for energy
                        efficiency
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ── Card: Pricing ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="size-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="retail_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Retail Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            ₱
                          </span>
                          <Input
                            {...field}
                            type="number"
                            step={0.01}
                            className="pl-8 h-11"
                            placeholder="0.00"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="cost_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            ₱
                          </span>
                          <Input
                            {...field}
                            type="number"
                            step={0.01}
                            className="pl-8 h-11"
                            placeholder="0.00"
                            value={field.value ?? ""}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Dealer/purchase price (used for net income calculation)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="discount_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount %</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="number"
                            step={1}
                            min={0}
                            max={100}
                            className="pl-10 h-11"
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const clamped = clampDiscount(e.target.value)
                              e.target.value = clamped?.toString() ?? ""
                              field.onChange(clamped)
                            }}
                            onBlur={(e) => {
                              const clamped = clampDiscount(e.target.value)
                              e.target.value = clamped?.toString() ?? ""
                              field.onChange(clamped)
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <PromoPricePreview
                retailPrice={retailPrice}
                discount={discount}
              />
            </CardContent>
          </Card>

          {/* ── Card: Warranty ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5" />
                Warranty Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="parts_warranty_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parts Warranty</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="number"
                            min={0}
                            step={1}
                            className="h-11 pr-16"
                            placeholder="60"
                            value={field.value ?? 60}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? 0
                                  : parseInt(e.target.value, 10),
                              )
                            }
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            months
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        {field.value
                          ? `≈ ${(Number(field.value) / 12).toFixed(1)} year(s)`
                          : "Default: 5 years"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="labor_warranty_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Labor Warranty</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type="number"
                            min={0}
                            step={1}
                            className="h-11 pr-16"
                            placeholder="12"
                            value={field.value ?? 12}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? 0
                                  : parseInt(e.target.value, 10),
                              )
                            }
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            months
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        {field.value
                          ? `≈ ${(Number(field.value) / 12).toFixed(1)} year(s)`
                          : "Default: 1 year"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Card: Price History (edit mode only) ── */}
          {isEditing &&
            initialData?.price_history &&
            initialData.price_history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="size-5" />
                    Price History
                    <Badge
                      variant="secondary"
                      className="text-xs ml-1"
                    >
                      {initialData.price_history.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PriceHistoryTimeline history={initialData.price_history} />
                </CardContent>
              </Card>
            )}

          {/* ── Footer ── */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="min-w-32"
            >
              {isEditing ? "Update Model" : "Create Model"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
