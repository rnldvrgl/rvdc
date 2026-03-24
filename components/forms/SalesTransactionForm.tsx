"use client"

import { ClientComboBox } from "@/components/custom/inputs/ClientComboBox"
import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import EntityDialog from "@/components/custom/shared/EntityDialog"
import ItemQuantitySelector from "@/components/custom/shared/ItemQuantitySelector"
import PaymentMethodSelector from "@/components/custom/shared/PaymentMethodSelector"
import { SalesTransactionPrintContent } from "@/components/custom/shared/SalesTransactionPrintContent"
import SaleTransactionVoidingForm from "@/components/forms/SaleTransactionVoidingForm"
import { Badge } from "@/components/ui/badge"
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
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Item,
  ItemEntry,
  SalesTransaction,
  Stock,
} from "@/lib/constants/interface"
import { PaginatedResult } from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheetDialog } from "@/lib/hooks/useEntityDialog"
import { useItemSelection } from "@/lib/hooks/useItemSelection"
import { usePrint } from "@/lib/hooks/usePrint"
import { useSalesTransactionMutations } from "@/lib/mutations/useSalesTransactionMutations"
import { useCustomItemTemplateChoices } from "@/lib/queries/inventory/useCustomItemTemplates"
import { useItemChoices, useStallChoices } from "@/lib/queries/useChoices"
import { formatCurrency } from "@/lib/utils/helpers"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  CreditCard,
  Package,
  Printer,
  Receipt,
  RefreshCw,
  RotateCcw,
  Save,
  ShoppingCart,
  Trash2,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import * as z from "zod"

interface SalesTransactionFormProps {
  initialData?: SalesTransaction
  onClose: () => void
}

export default function SalesTransactionForm({
  initialData,
  onClose,
}: SalesTransactionFormProps) {
  const baseSchema = z.object({
    transaction_type: z.enum(["sale", "replacement"]),
    stall: z.number().nullable().optional(),
    client_id: z.number().nullable().optional(),
    note: z.string().optional(),
    manual_receipt_number: z.string().optional(),
    transaction_date: z.string().optional(),
    order_discount: z.number().min(0).optional(),
    payments: z.array(
      z.object({
        payment_type: z.string().min(1, "Payment type is required"),
        amount: z.number().min(1, "Amount must be a positive number"),
        cheque_collection: z.number().nullable().optional(),
      }),
    ),
    items: z
      .array(
        z.object({
          item_id: z.number().nullable(),
          description: z.string().optional(),
          quantity: z.number().min(0.01, "Quantity must be at least 0.01"),
          final_price_per_unit: z.number().min(0),
          print_price_per_unit: z.number().min(0).optional(),
        }),
      )
      .min(1, "at least one item is required"),
  })

  const formSchema = baseSchema.superRefine((data, ctx) => {
    if (!data.client_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Client is required",
        path: ["client_id"],
      })
    }
    if (
      data.transaction_type === "sale" &&
      (!data.payments || data.payments.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one payment is required",
        path: ["payments"],
      })
    }
  })

  type FormValues = z.infer<typeof baseSchema>

  const resolver = zodResolver(formSchema)
  const form = useForm<FormValues>({
    resolver,
    defaultValues: {
      transaction_type:
        initialData?.transaction_type === "replacement"
          ? "replacement"
          : "sale",
      stall: initialData?.stall?.id ?? null,
      client_id: initialData?.client?.id,
      note: initialData?.note ?? "",
      manual_receipt_number: initialData?.manual_receipt_number ?? "",
      transaction_date:
        initialData?.transaction_date ??
        (initialData?.created_at ? initialData.created_at.slice(0, 10) : ""),
      order_discount: Number(initialData?.order_discount || 0),
      payments:
        initialData?.payments?.map((i) => ({
          payment_type: i.payment_type,
          amount: Number(i.amount) ?? 0,
          cheque_collection: i.cheque_collection ?? null,
        })) ?? [],
      items:
        initialData?.items?.map((i) => ({
          item_id: i.item?.id ?? null,
          description: i.item ? undefined : i.description,
          quantity: i.quantity ?? 0,
          final_price_per_unit:
            Number(i.final_price_per_unit) ?? Number(i.item?.retail_price) ?? 0,
          print_price_per_unit: Number(i.item?.retail_price) ?? 0,
        })) ?? [],
    },
    mode: "onChange",
  })

  const { data: stalls } = useStallChoices({})

  // Always use the sub stall for sales
  const subStall = useMemo(
    () => stalls?.find((s) => s.stall_type === "sub") ?? null,
    [stalls],
  )

  const [createdTransaction, setCreatedTransaction] =
    useState<SalesTransaction | null>(null)
  const { data: allItemsData } = useItemChoices()
  const { data: customItemTemplates = [] } = useCustomItemTemplateChoices()
  const allItems: Item[] = allItemsData ?? []

  // Fetch stock levels for the sub stall
  const selectedStallId = subStall?.id
  const { data: stockData } = useApiQuery<PaginatedResult<Stock>>({
    queryKey: ["stall-stocks-for-sale", selectedStallId],
    url: "/inventory/stocks/",
    params: { stall: selectedStallId, limit: 100 },
    enabled: !!selectedStallId,
  })

  // Build item_id -> available_quantity map
  const stockMap = useMemo(() => {
    const map = new Map<number, number>()
    if (stockData?.results) {
      for (const stock of stockData.results) {
        if (stock.track_stock) {
          map.set(stock.item.id, stock.available_quantity)
        }
      }
    }
    return map
  }, [stockData])

  // Build set of untracked item IDs
  const untrackedItemIds = useMemo(() => {
    const ids = new Set<number>()
    if (stockData?.results) {
      for (const stock of stockData.results) {
        if (!stock.track_stock) {
          ids.add(stock.item.id)
        }
      }
    }
    return ids
  }, [stockData])

  const { addTransaction, updateTransaction } = useSalesTransactionMutations()
  const { isAdmin } = useCurrentUser()
  const isVoided = initialData?.voided
  const isDisabled = form.formState.isSubmitting || isVoided

  const {
    entityState: voidingState,
    openEntity: openVoiding,
    closeEntity: closeVoiding,
  } = useEntitySheetDialog<SalesTransaction>()

  const {
    printRef,
    showPrintDialog,
    confirmPrint,
    cancelPrint,
    setShowPrintDialog,
  } = usePrint({
    documentTitle: "Receipt",
    requireConfirmation: true,
  })

  const { fields, append, remove } = useFieldArray<FormValues, "payments">({
    control: form.control,
    name: "payments",
  })

  const watchedItems = form.watch("items")
  const watchedPayments = form.watch("payments")
  const transactionType = form.watch("transaction_type")
  const watchedDiscount = form.watch("order_discount") || 0
  const isFreeTransaction = transactionType !== "sale"

  const totalItemsAmount = watchedItems.reduce(
    (acc, i) => acc + i.quantity * i.final_price_per_unit,
    0,
  )
  const discountAmount = Math.min(watchedDiscount, totalItemsAmount)
  const grandTotal = totalItemsAmount - discountAmount
  const totalPayments = watchedPayments.reduce((acc, p) => acc + p.amount, 0)
  const changeDue = totalPayments - grandTotal

  useEffect(() => {
    if (!initialData) return

    // Ensure choices are loaded before setting
    if (!allItemsData || !stalls) return

    // Stall setup — always use sub stall
    if (subStall) {
      form.setValue("stall", subStall.id)
    }

    // Items setup
    const initialItems =
      initialData.items?.map((i) => ({
        item_id: i.item?.id ?? null,
        description: i.item ? undefined : i.description,
        quantity: i.quantity ?? 0,
        final_price_per_unit:
          Number(i.final_price_per_unit) ?? Number(i.item?.retail_price) ?? 0,
      })) ?? []
    form.setValue("items", initialItems)

    setItems(
      initialData.items?.map((i) => ({
        item: i.item ?? null,
        quantity: i.quantity ?? 0,
        description: i.item ? undefined : i.description,
        final_price_per_unit: Number(i.final_price_per_unit) ?? 0,
      })) ?? [],
    )

    // Payments, client, receipt
    form.setValue("client_id", initialData.client?.id ?? null)
    form.setValue(
      "manual_receipt_number",
      initialData.manual_receipt_number ?? "",
    )
    form.setValue(
      "payments",
      initialData.payments?.map((p) => ({
        payment_type: p.payment_type,
        amount: Number(p.amount) ?? 0,
        cheque_collection: p.cheque_collection ?? null,
      })) ?? [],
    )

    // Re-validate so superRefine errors (client_id, payments) are cleared
    setTimeout(() => form.trigger(), 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, allItemsData, stalls, subStall])

  const handleSubmit = (data: FormValues) => {
    const isFree = data.transaction_type !== "sale"
    const subtotal = data.items.reduce(
      (acc, i) => acc + i.quantity * i.final_price_per_unit,
      0,
    )
    const discount = isFree ? 0 : Math.min(data.order_discount || 0, subtotal)
    const payload = {
      transaction_type: data.transaction_type,
      stall: subStall?.id ?? null,
      client: data.client_id ?? null,
      note: data.note || null,
      manual_receipt_number: data.manual_receipt_number ?? null,
      transaction_date: data.transaction_date || null,
      order_discount: discount,
      items: data.items.map((i) => ({
        item: i.item_id,
        ...(i.item_id === null && i.description
          ? { description: i.description }
          : {}),
        quantity: i.quantity,
        final_price_per_unit: isFree ? 0 : i.final_price_per_unit,
      })),
      payments: isFree
        ? []
        : data.payments.map((p) => ({
            payment_type: p.payment_type,
            amount: p.amount,
            cheque_collection:
              p.payment_type === "cheque" ? p.cheque_collection : undefined,
          })),
    }

    if (initialData) {
      updateTransaction.mutate(
        { id: initialData.id, data: payload },
        { onSuccess: onClose },
      )
    } else {
      addTransaction.mutate(payload, {
        onSuccess: (data: { data: SalesTransaction }) => {
          const formItems = form.getValues().items

          const printPrices = formItems.map((i) => i.print_price_per_unit)

          const itemsWithPrintPrice = data.data.items.map((item, idx) => ({
            ...item,
            final_price_per_unit: item.final_price_per_unit,
            print_price_per_unit: printPrices[idx],
          }))

          setCreatedTransaction({
            ...data.data,
            items: itemsWithPrintPrice,
          })

          setShowPrintDialog(true)
        },
      })
    }
  }

  const { items, setItems } = useItemSelection<
    Item,
    ItemEntry,
    SalesTransaction
  >({
    initialData,
    allItems,
    getInitialItems: (data) =>
      data.items?.map((i) => ({
        item: i.item ?? null,
        quantity: i.quantity ?? 0,
        description: i.item ? undefined : i.description,
        final_price_per_unit: Number(i.final_price_per_unit) ?? 0,
      })) ?? [],
  })

  return (
    <>
      <div className="fixed left-[-9999px] top-0">
        <SalesTransactionPrintContent
          ref={printRef}
          entity={createdTransaction}
          stall={subStall}
        />
      </div>

      {initialData && (
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant={isVoided ? "destructive" : "success"}
              className="text-xs"
            >
              {isVoided ? "Voided" : "Active"}
            </Badge>
            {initialData.stall && (
              <Badge
                variant="outline"
                className="text-xs"
              >
                {initialData.stall.name}
              </Badge>
            )}
            {initialData.system_receipt_number && (
              <Badge
                variant="secondary"
                className="text-xs font-mono"
              >
                {initialData.system_receipt_number}
              </Badge>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={
              isVoided ? "" : "text-destructive hover:text-destructive"
            }
            onClick={() => openVoiding()}
          >
            {isVoided ? (
              <>
                <RotateCcw className="mr-1.5 size-3.5" /> Reactivate
              </>
            ) : (
              <>
                <Trash2 className="mr-1.5 size-3.5" /> Void
              </>
            )}
          </Button>
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={
            initialData
              ? (e) => {
                  e.preventDefault()
                  handleSubmit(form.getValues())
                }
              : form.handleSubmit(handleSubmit)
          }
          className="space-y-5"
        >
          {/* Transaction Info */}
          <section className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Receipt className="size-3" />
              Transaction Info
            </h4>

            {/* Transaction Type Selector */}
            {!initialData && (
              <FormField
                control={form.control}
                name="transaction_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <div className="flex gap-1.5">
                      {[
                        {
                          value: "sale" as const,
                          label: "Sale",
                          icon: ShoppingCart,
                        },
                        {
                          value: "replacement" as const,
                          label: "Replacement",
                          icon: RefreshCw,
                        },
                      ].map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          size="sm"
                          variant={
                            field.value === opt.value ? "default" : "outline"
                          }
                          className="flex-1 text-xs"
                          disabled={isDisabled}
                          onClick={() => {
                            field.onChange(opt.value)
                            if (opt.value !== "sale") {
                              form.setValue("payments", [])
                            }
                          }}
                        >
                          <opt.icon className="mr-1 size-3" />
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Type badge for existing transactions */}
            {initialData?.transaction_type === "replacement" && (
              <Badge
                variant="secondary"
                className="text-xs"
              >
                Replacement
              </Badge>
            )}

            <div className="grid gap-3">
              <FormField
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Client</FormLabel>
                    <ClientComboBox
                      disabled={isDisabled}
                      value={field.value ? Number(field.value) : null}
                      onChange={(val) => field.onChange(val ?? null)}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manual_receipt_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Official Receipt #</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isDisabled}
                        {...field}
                        placeholder="e.g. 001245"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAdmin && (
                <FormField
                  control={form.control}
                  name="transaction_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          disabled={isDisabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {isFreeTransaction && (
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Replacement Reason</FormLabel>
                      <FormControl>
                        <Textarea
                          disabled={isDisabled}
                          {...field}
                          placeholder="e.g. Warranty replacement for defective belt"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </section>

          <Separator />

          {/* Items */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label
                required
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"
              >
                <Package className="size-3" />
                Items
              </Label>
              {watchedItems.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] h-5 px-1.5"
                >
                  {watchedItems.length}
                </Badge>
              )}
            </div>
            <ItemQuantitySelector
              disabled={isDisabled}
              items={items}
              allItems={allItems}
              customItemTemplates={customItemTemplates}
              stockMap={stockMap.size > 0 ? stockMap : undefined}
              untrackedItemIds={
                untrackedItemIds.size > 0 ? untrackedItemIds : undefined
              }
              onChange={(updatedItems) => {
                form.setValue(
                  "items",
                  updatedItems.map((i) => ({
                    item_id: i.item?.id ?? null,
                    description: i.item ? undefined : (i.description ?? ""),
                    quantity: i.quantity,
                    final_price_per_unit: isFreeTransaction
                      ? 0
                      : (i.final_price_per_unit ??
                        Number(i.item?.retail_price) ??
                        0),
                    print_price_per_unit: isFreeTransaction
                      ? 0
                      : (i.print_price_per_unit ??
                        i.final_price_per_unit ??
                        Number(i.item?.retail_price) ??
                        0),
                  })),
                  { shouldDirty: true, shouldValidate: true },
                )
                setItems(updatedItems)
              }}
              allowPriceChange={!isFreeTransaction}
            />
            {form.formState.errors.items && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.items.message}
              </p>
            )}
          </section>

          <Separator />

          {/* Transaction Discount - only for regular sales */}
          {!isFreeTransaction && (
            <FormField
              control={form.control}
              name="order_discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Transaction Discount
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ₱
                      </span>
                      <Input
                        type="number"
                        min={0}
                        max={totalItemsAmount}
                        step={0.01}
                        placeholder="0.00"
                        className="pl-7"
                        disabled={isDisabled}
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          field.onChange(isNaN(val) ? 0 : val)
                        }}
                      />
                    </div>
                  </FormControl>
                  {discountAmount > 0 && totalItemsAmount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {((discountAmount / totalItemsAmount) * 100).toFixed(1)}%
                      off · Total after discount:{" "}
                      <span className="font-medium">
                        {formatCurrency(grandTotal)}
                      </span>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Payments - only for regular sales */}
          {!isFreeTransaction && (
            <>
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    required
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"
                  >
                    <CreditCard className="size-3" />
                    Payments
                  </Label>
                  {watchedPayments.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 px-1.5"
                    >
                      {watchedPayments.length}
                    </Badge>
                  )}
                </div>
                <PaymentMethodSelector
                  control={form.control as never}
                  fields={fields as never}
                  append={append as never}
                  remove={remove}
                  setValue={form.setValue as never}
                  disabled={isDisabled}
                  required
                  totalItemsAmount={grandTotal}
                  clientId={form.watch("client_id")}
                />
                {form.formState.errors.payments && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.payments?.message ||
                      form.formState.errors.payments?.root?.message}
                  </p>
                )}
              </section>
            </>
          )}

          {/* Summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {isFreeTransaction ? "Items to deduct" : "Subtotal"} ·{" "}
                {watchedItems.length} item
                {watchedItems.length !== 1 && "s"}
              </span>
              {!isFreeTransaction && (
                <span className="font-medium">
                  {formatCurrency(totalItemsAmount)}
                </span>
              )}
            </div>
            {!isFreeTransaction && (
              <>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Paid · {watchedPayments.length} payment
                    {watchedPayments.length !== 1 && "s"}
                  </span>
                  <span className="font-medium text-primary">
                    {formatCurrency(totalPayments)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm font-semibold">
                    {changeDue >= 0 ? "Change" : "Balance Due"}
                  </span>
                  <span
                    className={`text-base font-bold ${
                      changeDue >= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {formatCurrency(Math.abs(changeDue))}
                  </span>
                </div>
              </>
            )}
            {isFreeTransaction && (
              <p className="text-xs text-muted-foreground">
                Items will be deducted from stock as free replacements.
              </p>
            )}
          </div>

          {/* Submit */}
          {!isVoided && (
            <Button
              type="submit"
              className="w-full"
              disabled={
                form.formState.isSubmitting ||
                (!initialData &&
                  (!form.formState.isDirty || !form.formState.isValid))
              }
            >
              <Save className="mr-2 size-4" />
              {form.formState.isSubmitting
                ? initialData
                  ? "Updating..."
                  : "Creating..."
                : initialData
                  ? "Update Transaction"
                  : transactionType === "replacement"
                    ? "Create Replacement"
                    : "Create Transaction"}
            </Button>
          )}
        </form>
      </Form>
      <ConfirmDialog
        open={showPrintDialog}
        onConfirm={() => {
          confirmPrint()
          onClose()
        }}
        onCancel={() => {
          cancelPrint()
          onClose()
        }}
        title="Print Receipt?"
        description="Transaction created successfully. Would you like to print the receipt now?"
        Icon={Printer}
        confirmText="Print"
        cancelText="No, thanks"
      />

      <EntityDialog<SalesTransaction>
        open={voidingState.open}
        onClose={() => {
          closeVoiding()
          onClose()
        }}
        title="Void Transaction"
        description="Are you sure you want to void this transaction?"
        withCloseConfirmation
        renderForm={({ forceClose }) => (
          <SaleTransactionVoidingForm
            onClose={forceClose}
            entity={initialData}
          />
        )}
      />
    </>
  )
}
