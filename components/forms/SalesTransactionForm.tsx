"use client"

import { ClientComboBox } from "@/components/custom/inputs/ClientComboBox"
import DatePicker from "@/components/custom/inputs/DatePicker"
import EntityDialog from "@/components/custom/shared/EntityDialog"
import ItemQuantitySelector from "@/components/custom/shared/ItemQuantitySelector"
import PaymentMethodSelector from "@/components/custom/shared/PaymentMethodSelector"
import { SalesTransactionPrintContent } from "@/components/custom/shared/SalesTransactionPrintContent"
import SaleTransactionVoidingForm from "@/components/forms/SaleTransactionVoidingForm"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Item,
  ItemEntry,
  SalesTransaction,
  Stock,
} from "@/lib/constants/interface"
import { PaginatedResult } from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { useRecentClients } from "@/lib/queries/clients/useClients"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheetDialog } from "@/lib/hooks/useEntityDialog"
import { useItemSelection } from "@/lib/hooks/useItemSelection"
import { usePrint } from "@/lib/hooks/usePrint"
import { useSalesTransactionMutations } from "@/lib/mutations/useSalesTransactionMutations"
import { useCustomItemTemplateChoices } from "@/lib/queries/inventory/useCustomItemTemplates"
import { useItemChoices, useStallChoices, useClientChoices } from "@/lib/queries/useChoices"
import { holdSale } from "@/lib/utils/heldSales"
import { formatCurrency } from "@/lib/utils/helpers"
import { getPinnedClientIds } from "@/lib/utils/pinnedClients"
import {
  getSaleTemplates,
  removeSaleTemplate,
  saveSaleTemplate,
  type SaleTemplate,
} from "@/lib/utils/saleTemplates"
import { playSuccessSound } from "@/lib/utils/sounds"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Bookmark,
  CreditCard,
  Loader2,
  Package,
  Pause,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  RotateCcw,
  Save,
  ShoppingCart,
  Star,
  Trash2,
  X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import * as z from "zod"

import type { HeldSale } from "@/lib/utils/heldSales"

interface SalesTransactionFormProps {
  initialData?: SalesTransaction
  onClose: () => void
  onNewSale?: (opts?: { clientId?: number | null }) => void
  defaultClientId?: number | null
  heldSale?: HeldSale | null
  onHeld?: () => void
}

export default function SalesTransactionForm({
  initialData,
  onClose,
  onNewSale,
  defaultClientId,
  heldSale,
  onHeld,
}: SalesTransactionFormProps) {
  const baseSchema = z.object({
    transaction_type: z.enum(["sale", "replacement"]),
    stall: z.number().nullable().optional(),
    client_id: z.number().nullable().optional(),
    note: z.string().optional(),
    manual_receipt_number: z.string().optional(),
    receipt_book: z.string().optional(),
    with_2307: z.boolean().optional(),
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
        heldSale?.transactionType ??
        (initialData?.transaction_type === "replacement"
          ? "replacement"
          : "sale"),
      stall: initialData?.stall?.id ?? null,
      client_id:
        initialData?.client?.id ??
        heldSale?.clientId ??
        defaultClientId ??
        undefined,
      note: initialData?.note ?? heldSale?.note ?? "",
      manual_receipt_number:
        initialData?.manual_receipt_number ??
        heldSale?.manualReceiptNumber ??
        "",
      receipt_book: initialData?.receipt_book ?? heldSale?.receiptBook ?? "",
      with_2307: initialData?.with_2307 ?? heldSale?.with2307 ?? false,
      transaction_date:
        initialData?.transaction_date ??
        (initialData?.created_at
          ? initialData.created_at.slice(0, 10)
          : (() => {
              const d = new Date()
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
            })()),
      order_discount: Number(
        initialData?.order_discount || heldSale?.orderDiscount || 0,
      ),
      payments: initialData?.payments?.map((i) => ({
        payment_type: i.payment_type,
        amount: Number(i.amount) ?? 0,
        cheque_collection: i.cheque_collection ?? null,
      })) ??
        heldSale?.payments ??
          // Default to a single Cash payment row for new sales
          [{ payment_type: "cash", amount: 0, cheque_collection: null }],
      items:
        initialData?.items?.map((i) => ({
          item_id: i.item?.id ?? null,
          description: i.item ? undefined : i.description,
          quantity: i.quantity ?? 0,
          final_price_per_unit:
            Number(i.final_price_per_unit) ?? Number(i.item?.retail_price) ?? 0,
          print_price_per_unit: Number(i.item?.retail_price) ?? 0,
        })) ??
        heldSale?.items ??
        [],
    },
    mode: "onChange",
  })

  const { data: stalls, isLoading: stallsLoading } = useStallChoices({})

  // Always use the sub stall for sales
  const subStall = useMemo(
    () => stalls?.find((s) => s.stall_type === "sub") ?? null,
    [stalls],
  )

  // Determine if current transaction uses Main Stall (OR) — affects 2307 visibility
  const isMainStall = useMemo(() => {
    if (initialData?.stall?.stall_type === "main") return true
    return false
  }, [initialData])

  const [createdTransaction, setCreatedTransaction] =
    useState<SalesTransaction | null>(null)
  const [keepClient, setKeepClient] = useState(true)
  const [templates, setTemplates] = useState<SaleTemplate[]>([])
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState("")

  // Load templates on mount
  useEffect(() => {
    setTemplates(getSaleTemplates())
  }, [])
  const { data: allItemsData, isLoading: itemsLoading } = useItemChoices()
  const { data: customItemTemplates = [] } = useCustomItemTemplateChoices()
  const { data: recentClients = [] } = useRecentClients(8)
  const { data: allClients = [] } = useClientChoices()
  const pinnedClients = useMemo(() => {
    const ids = getPinnedClientIds()
    if (ids.length === 0) return []
    return ids
      .map((id) => allClients.find((c) => c.id === id))
      .filter(Boolean) as typeof allClients
  }, [allClients])
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
  // When editing, add back the quantities from the original sale since those
  // are already committed to this transaction and shouldn't count as "used"
  const stockMap = useMemo(() => {
    const map = new Map<number, number>()
    if (stockData?.results) {
      for (const stock of stockData.results) {
        if (stock.track_stock) {
          map.set(stock.item.id, stock.available_quantity)
        }
      }
    }
    if (initialData?.items) {
      for (const item of initialData.items) {
        if (item.item) {
          const current = map.get(item.item.id)
          if (current !== undefined) {
            map.set(item.item.id, current + (item.quantity ?? 0))
          }
        }
      }
    }
    return map
  }, [stockData, initialData])

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

  const hasInitializedRef = useRef(false)

  useEffect(() => {
    if (!initialData) return

    // Ensure choices are loaded before setting
    if (!allItemsData || !stalls) return

    // Only initialize once — skip if already done (prevents React Query
    // background refetches from resetting user edits)
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

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
      receipt_book: data.receipt_book || null,
      with_2307: data.with_2307 ?? false,
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
          playSuccessSound()
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

  // Initialize items from held sale once allItems are loaded
  const heldInitRef = useRef(false)
  useEffect(() => {
    if (!heldSale || heldInitRef.current || allItems.length === 0) return
    heldInitRef.current = true
    setItems(
      heldSale.items.map((i) => ({
        item: allItems.find((a) => a.id === i.item_id) ?? null,
        quantity: i.quantity,
        description: i.item_id === null ? i.description : undefined,
        final_price_per_unit: i.final_price_per_unit,
        print_price_per_unit: i.print_price_per_unit,
      })),
    )
    // Mark form dirty so submit button enables
    setTimeout(() => form.trigger(), 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heldSale, allItems])

  // Ctrl+Enter keyboard shortcut for submit
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault()
        formRef.current?.requestSubmit()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  if (initialData && (itemsLoading || stallsLoading)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
          ref={formRef}
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
                      allowCreate={!initialData}
                    />
                    {!initialData && pinnedClients.length > 0 && !field.value && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          <Star className="size-3" />
                          Pinned
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {pinnedClients.map((client) => (
                            <Button
                              key={client.id}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2.5"
                              onClick={() => field.onChange(client.id)}
                            >
                              {client.full_name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    {!initialData && recentClients.length > 0 && !field.value && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          <Star className="size-3" />
                          Recent
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {recentClients.map((client) => (
                            <Button
                              key={client.id}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2.5"
                              onClick={() => field.onChange(client.id)}
                            >
                              {client.full_name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manual_receipt_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isMainStall
                        ? "Official Receipt # (OR)"
                        : "Sales Invoice # (SI)"}
                    </FormLabel>
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

              <FormField
                control={form.control}
                name="receipt_book"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Book #</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isDisabled}
                        {...field}
                        placeholder="e.g. 1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isMainStall && (
                <FormField
                  control={form.control}
                  name="with_2307"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isDisabled}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        With BIR Form 2307
                      </FormLabel>
                    </FormItem>
                  )}
                />
              )}

              {isAdmin && (
                <FormField
                  control={form.control}
                  name="transaction_date"
                  render={({ field }) => (
                    <DatePicker
                      field={{
                        value: field.value
                          ? new Date(field.value + "T12:00:00")
                          : undefined,
                        onChange: (date) =>
                          field.onChange(
                            date
                              ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                              : "",
                          ),
                      }}
                      label="Transaction Date"
                      disabled={isDisabled}
                    />
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
              <div className="flex items-center gap-1.5">
                {watchedItems.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-5 px-1.5"
                  >
                    {watchedItems.length}
                  </Badge>
                )}
                {!initialData && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                      >
                        <Bookmark className="size-3 mr-1" />
                        Templates
                        {templates.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-1 h-4 min-w-4 rounded-full px-1 text-[9px]"
                          >
                            {templates.length}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-64 p-2"
                      align="end"
                    >
                      <div className="space-y-2">
                        {/* Save current items as template */}
                        {watchedItems.length > 0 && (
                          <div>
                            {showSaveTemplate ? (
                              <div className="flex gap-1">
                                <Input
                                  value={templateName}
                                  onChange={(e) =>
                                    setTemplateName(e.target.value)
                                  }
                                  placeholder="Template name"
                                  className="h-7 text-xs"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === "Enter" &&
                                      templateName.trim()
                                    ) {
                                      e.preventDefault()
                                      saveSaleTemplate(
                                        templateName.trim(),
                                        form.getValues("items"),
                                      )
                                      setTemplates(getSaleTemplates())
                                      setTemplateName("")
                                      setShowSaveTemplate(false)
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  disabled={!templateName.trim()}
                                  onClick={() => {
                                    saveSaleTemplate(
                                      templateName.trim(),
                                      form.getValues("items"),
                                    )
                                    setTemplates(getSaleTemplates())
                                    setTemplateName("")
                                    setShowSaveTemplate(false)
                                  }}
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full h-7 text-xs"
                                onClick={() => setShowSaveTemplate(true)}
                              >
                                <Save className="size-3 mr-1" />
                                Save current items as template
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Template list */}
                        {templates.length > 0 ? (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {templates.map((t) => (
                              <div
                                key={t.id}
                                className="flex items-center justify-between rounded-md border px-2 py-1.5 text-xs"
                              >
                                <button
                                  type="button"
                                  className="flex-1 text-left hover:underline font-medium"
                                  onClick={() => {
                                    // Load template items into form
                                    form.setValue("items", t.items, {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    })
                                    setItems(
                                      t.items.map((i) => ({
                                        item:
                                          allItems.find(
                                            (a) => a.id === i.item_id,
                                          ) ?? null,
                                        quantity: i.quantity,
                                        description:
                                          i.item_id === null
                                            ? i.description
                                            : undefined,
                                        final_price_per_unit:
                                          i.final_price_per_unit,
                                        print_price_per_unit:
                                          i.print_price_per_unit,
                                      })),
                                    )
                                  }}
                                >
                                  {t.name}
                                  <span className="text-muted-foreground ml-1">
                                    ({t.items.length} item
                                    {t.items.length !== 1 ? "s" : ""})
                                  </span>
                                </button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-5 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    removeSaleTemplate(t.id)
                                    setTemplates(getSaleTemplates())
                                  }}
                                >
                                  <X className="size-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground text-center py-2">
                            No templates saved yet
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
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
            <div className="space-y-1">
              <div className="grid gap-2">
                {!initialData && onHeld && watchedItems.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="warning"
                        className="shrink-0"
                        onClick={() => {
                          const values = form.getValues()
                          holdSale({
                            label: `${watchedItems.length} item${watchedItems.length !== 1 ? "s" : ""} · ${formatCurrency(grandTotal)}`,
                            clientId: values.client_id ?? null,
                            clientName: "",
                            items: values.items,
                            payments: values.payments.map((p) => ({
                              payment_type: p.payment_type,
                              amount: p.amount,
                              cheque_collection: p.cheque_collection ?? null,
                            })),
                            transactionType: values.transaction_type,
                            orderDiscount: values.order_discount || 0,
                            note: values.note || "",
                            manualReceiptNumber:
                              values.manual_receipt_number || "",
                            receiptBook: values.receipt_book || "",
                            with2307: values.with_2307 || false,
                          })
                          onHeld()
                          onClose()
                        }}
                      >
                        <Pause className="mr-1.5 size-3.5" />
                        Hold
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Save this sale as a draft to resume later
                    </TooltipContent>
                  </Tooltip>
                )}
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
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Ctrl + Enter
              </p>
            </div>
          )}
        </form>
      </Form>
      <AlertDialog
        open={showPrintDialog}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            cancelPrint()
            onClose()
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transaction Created</AlertDialogTitle>
            <AlertDialogDescription>
              Transaction created successfully. What would you like to do next?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {onNewSale && (
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={keepClient}
                onCheckedChange={(v) => setKeepClient(!!v)}
              />
              <span className="text-sm">Same client for next sale</span>
            </label>
          )}
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                cancelPrint()
                onClose()
              }}
            >
              <X className="mr-1.5 size-3.5" />
              Close
            </Button>
            <Button
              variant="default"
              onClick={() => {
                confirmPrint()
                onClose()
              }}
            >
              <Printer className="mr-1.5 size-3.5" />
              Print & Close
            </Button>
            {onNewSale && (
              <Button
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  confirmPrint()
                  const clientId = keepClient
                    ? form.getValues("client_id")
                    : undefined
                  onNewSale({ clientId: clientId ?? null })
                }}
              >
                <Plus className="mr-1.5 size-3.5" />
                Print & New Sale
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
