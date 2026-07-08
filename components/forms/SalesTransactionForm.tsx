"use client"

import { ClientCardSelect } from "@/components/custom/inputs/ClientComboBox"
import DatePicker from "@/components/custom/inputs/DatePicker"
import EntityDialog from "@/components/custom/shared/EntityDialog"
import AddStockForm from "@/components/forms/inventory/AddStockForm"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
import { Skeleton } from "@/components/ui/skeleton"
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

import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useEntitySheetDialog } from "@/lib/hooks/useEntityDialog"
import { useItemSelection } from "@/lib/hooks/useItemSelection"
import { usePrint } from "@/lib/hooks/usePrint"
import { useSalesTransactionMutations } from "@/lib/mutations/useSalesTransactionMutations"
import { useItemChoices, useStallChoices } from "@/lib/queries/useChoices"
import { holdSale } from "@/lib/utils/heldSales"
import { cn, formatCurrency } from "@/lib/utils/helpers"

import {
    getSaleTemplates,
    removeSaleTemplate,
    saveSaleTemplate,
    type SaleTemplate,
} from "@/lib/utils/saleTemplates"
import { playSuccessSound } from "@/lib/utils/sounds"
import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "framer-motion"
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
    Trash2,
    X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import * as z from "zod"

import type { HeldSale } from "@/lib/utils/heldSales"
import { AnimatedNumber } from "@/components/custom/shared/AnimatedNumber"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TEMPLATE_NAME_MAX_LENGTH } from "@/lib/constants/general"

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
        data.items.forEach((item, idx) => {
            if (item.item_id === null && !(item.description ?? "").trim()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Custom item needs a name",
                    path: ["items", idx, "description"],
                })
            }
        })
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
    const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
    const [templateNameInput, setTemplateNameInput] = useState("")
    const [duplicateTemplate, setDuplicateTemplate] =
        useState<SaleTemplate | null>(null)
    const [addStockDialogStock, setAddStockDialogStock] = useState<Stock | null>(null)

    // Load templates on mount
    useEffect(() => {
        setTemplates(getSaleTemplates())
    }, [])
    const { data: allItemsData, isLoading: itemsLoading } = useItemChoices()
    const allItems: Item[] = allItemsData ?? []

    // Fetch stock levels for the sub stall
    const selectedStallId = subStall?.id
    const { data: stockData } = useApiQuery<PaginatedResult<Stock>>({
        queryKey: ["stall-stocks-for-sale", selectedStallId],
        url: "/inventory/stocks/",
        params: { stall: selectedStallId, limit: 500 },
        enabled: !!selectedStallId,
    })

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
    const isInitialLoading = itemsLoading || stallsLoading
    const isSaving = addTransaction.isPending || updateTransaction.isPending
    const isDisabled = isSaving || isVoided

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
    const watchedClientId = form.watch("client_id")
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

    const hasPaymentAmount =
        isFreeTransaction || watchedPayments.some((p) => p.amount > 0)
    const showSubmitSection = watchedItems.length > 0 && hasPaymentAmount

    // Validates the current cart before it can be saved as a template —
    // custom items need a name, and every item needs a real price/quantity,
    // otherwise loading the template later just recreates the same gaps.
    const itemValidationErrors = useMemo(() => {
        if (!templateDialogOpen) return []
        if (watchedItems.length === 0) {
            return ["Add at least one item to the cart before saving a template."]
        }

        const errors: string[] = []
        watchedItems.forEach((item, idx) => {
            const label =
                item.item_id === null
                    ? item.description?.trim() || `Item ${idx + 1}`
                    : `Item ${idx + 1}`

            if (item.item_id === null && !item.description?.trim()) {
                errors.push(`"${label}" needs a name before it can be saved.`)
            }
            if (!item.final_price_per_unit || item.final_price_per_unit <= 0) {
                errors.push(`"${label}" needs a price greater than ₱0.`)
            }
            if (!item.quantity || item.quantity <= 0) {
                errors.push(`"${label}" needs a quantity greater than 0.`)
            }
        })
        return errors
    }, [templateDialogOpen, watchedItems])

    const hasInitializedRef = useRef(false)
    const submitLockRef = useRef(false)

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

    const handleSubmit = async (data: FormValues) => {
        if (submitLockRef.current || isSaving) return
        submitLockRef.current = true

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

        try {
            if (initialData) {
                await updateTransaction.mutateAsync({ id: initialData.id, data: payload })
                onClose()
                return
            }

            const createdResponse = await addTransaction.mutateAsync(payload) as {
                data?: SalesTransaction | { data: SalesTransaction }
            }

            const responseData = createdResponse?.data
            const createdSale =
                responseData && typeof responseData === "object" && "data" in responseData
                    ? responseData.data
                    : (responseData as SalesTransaction | undefined)

            if (!createdSale) return

            playSuccessSound()
            const formItems = form.getValues().items

            const printPrices = formItems.map((i) => i.print_price_per_unit)

            const itemsWithPrintPrice = createdSale.items.map((item, idx) => ({
                ...item,
                final_price_per_unit: item.final_price_per_unit,
                print_price_per_unit: printPrices[idx],
            }))

            setCreatedTransaction({
                ...createdSale,
                items: itemsWithPrintPrice,
            })

            setShowPrintDialog(true)
        } catch {
            // handled by useApiMutation
        } finally {
            submitLockRef.current = false
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

    // Quick-load a saved template into the cart in one tap
    const applyTemplate = (t: SaleTemplate) => {
        form.setValue("items", t.items, {
            shouldDirty: true,
            shouldValidate: true,
        })
        setItems(
            t.items.map((i) => ({
                item: allItems.find((a) => a.id === i.item_id) ?? null,
                quantity: i.quantity,
                description: i.item_id === null ? i.description : undefined,
                final_price_per_unit: i.final_price_per_unit,
                print_price_per_unit: i.print_price_per_unit,
            })),
        )
    }

    const openTemplateDialog = () => {
        setTemplateNameInput("")
        setDuplicateTemplate(null)
        setTemplateDialogOpen(true)
    }

    const handleTemplateDialogOpenChange = (open: boolean) => {
        setTemplateDialogOpen(open)
        if (!open) {
            setTemplateNameInput("")
            setDuplicateTemplate(null)
        }
    }

    // Saving is a two-step confirm when the name collides with an existing
    // template: first press surfaces the warning, second press (button is
    // relabeled "Overwrite Template") actually replaces it.
    const handleSaveTemplate = () => {
        const trimmedName = templateNameInput.trim()
        if (!trimmedName || itemValidationErrors.length > 0) return

        const existing = templates.find(
            (t) => t.name.trim().toLowerCase() === trimmedName.toLowerCase(),
        )

        if (existing && duplicateTemplate?.id !== existing.id) {
            setDuplicateTemplate(existing)
            return
        }

        if (existing) {
            removeSaleTemplate(existing.id)
        }

        saveSaleTemplate(trimmedName, form.getValues("items"))
        setTemplates(getSaleTemplates())
        handleTemplateDialogOpenChange(false)
    }

    // ── Loading skeleton — mirrors the real form's shape so the layout
    // doesn't jump once content loads, and gives a sense of what's coming ──
    if (isInitialLoading) {
        return (
            <div className="space-y-4 sm:space-y-5">
                {/* Transaction Info skeleton */}
                <div className="space-y-3">
                    <Skeleton className="h-3 w-32" />
                    <div className="flex gap-1.5">
                        <Skeleton className="h-8 flex-1 rounded-md" />
                        <Skeleton className="h-8 flex-1 rounded-md" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Skeleton className="h-3 w-14" />
                            <Skeleton className="h-9 w-full rounded-md" />
                        </div>
                        <div className="space-y-1.5">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-9 w-full rounded-md" />
                        </div>
                        <div className="space-y-1.5">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-9 w-full rounded-md" />
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Items skeleton */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-14" />
                        <Skeleton className="h-6 w-20 rounded-md" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-md" />
                    <div className="space-y-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-md border p-2.5">
                                <Skeleton className="size-8 shrink-0 rounded" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-3.5 w-32" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                                <Skeleton className="h-6 w-14 rounded-md" />
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Summary skeleton */}
                <div className="space-y-2 rounded-lg bg-muted/50 p-3 sm:p-4">
                    <div className="flex justify-between">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3.5 w-16" />
                    </div>
                    <div className="flex justify-between">
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-3.5 w-16" />
                    </div>
                    <Separator />
                    <div className="flex justify-between pt-1">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-5 w-20" />
                    </div>
                </div>

                <Skeleton className="h-10 w-full rounded-md" />
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

            <div className={cn("relative", isSaving && "pointer-events-none opacity-90")}>
                {/* Ambient "working" indicator — a thin indeterminate bar instead of a
                    full backdrop-blur overlay, so the form stays visible while saving */}
                <AnimatePresence>
                    {isSaving && (
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="absolute inset-x-0 top-0 z-20 h-0.5 origin-left overflow-hidden rounded-full bg-primary/20"
                        >
                            <motion.div
                                animate={{ x: ["-100%", "200%"] }}
                                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                                className="h-full w-1/3 bg-primary"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {initialData && (
                    <div className="flex flex-col gap-2 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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
                            className={cn(
                                "w-full shrink-0 sm:w-auto",
                                !isVoided && "text-destructive hover:text-destructive",
                            )}
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
                                    void handleSubmit(form.getValues())
                                }
                                : form.handleSubmit(handleSubmit)
                        }
                        className="space-y-4 sm:space-y-5"
                    >
                        {watchedItems.length > 0 && (
                            <Alert className="sticky flex flex-wrap items-center justify-between gap-1 px-2.5 py-1.5 top-0 z-10 text-xs sm:px-3 sm:py-2" variant="info">
                                <AlertTitle className="text-[11px] sm:text-xs">
                                    {watchedItems.length} item{watchedItems.length !== 1 && "s"} added
                                </AlertTitle>
                                {!isFreeTransaction && (
                                    <AnimatedNumber
                                        value={grandTotal}
                                        prefix="₱"
                                        className="text-xs font-semibold sm:text-sm"
                                    />
                                )}
                            </Alert>
                        )}

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
                                                        <opt.icon className="mr-1 size-3 shrink-0" />
                                                        <span className="truncate">{opt.label}</span>
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

                            {/* Required: Client — kept isolated from the optional fields
                                below so it reads as the one thing you must set first */}
                            <FormField
                                name="client_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>Client</FormLabel>
                                        <ClientCardSelect
                                            disabled={isDisabled}
                                            value={field.value ? Number(field.value) : null}
                                            onChange={(val) => field.onChange(val ?? null)}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Optional details — visually demoted so it's clear these
                                aren't blocking progress the way Client is. Two columns
                                once there's room (sm+), single column on phones. */}
                            <AnimatePresence>
                                {watchedClientId && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        transition={{ type: "spring", stiffness: 400, damping: 34 }}
                                        className="space-y-3 overflow-hidden"
                                    >
                                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                                            Additional details (optional)
                                        </p>
                                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="manual_receipt_number"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-muted-foreground">
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
                                                        <FormLabel className="text-muted-foreground">
                                                            Receipt Book #
                                                        </FormLabel>
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
                                                        <FormItem className="flex flex-row items-center gap-2 space-y-0 sm:col-span-2">
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
                                                        <div className="sm:col-span-2">
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
                                                        </div>
                                                    )}
                                                />
                                            )}

                                            {isFreeTransaction && (
                                                <FormField
                                                    control={form.control}
                                                    name="note"
                                                    render={({ field }) => (
                                                        <FormItem className="sm:col-span-2">
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
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>

                        <Separator />

                        {/* Items */}
                        <section className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <Label
                                    required
                                    className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"
                                >
                                    <Package className="size-3" />
                                    Items
                                    {watchedItems.length > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="rounded-full"
                                        >
                                            {watchedItems.length}
                                        </Badge>
                                    )}
                                </Label>

                                <div className="flex items-center gap-1.5">
                                    {!initialData && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <Bookmark className="size-3 mr-1" />
                                                    Templates
                                                    {templates.length > 0 && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="rounded-full"
                                                        >
                                                            {templates.length}
                                                        </Badge>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                align="end"
                                                className="w-80 max-w-[calc(100vw-2rem)]"
                                            >
                                                <div className="space-y-2">
                                                    {watchedItems.length > 0 && (
                                                        <Button
                                                            type="button"
                                                            variant="warning"
                                                            size="sm"
                                                            className="w-full"
                                                            onClick={openTemplateDialog}
                                                        >
                                                            <Save className="size-3 mr-1" />
                                                            Save current items as template
                                                        </Button>
                                                    )}

                                                    {/* Template list */}
                                                    {templates.length > 0 ? (
                                                        <div className="space-y-1 max-h-48 overflow-y-auto">
                                                            {templates.map((t) => (
                                                                <div
                                                                    key={t.id}
                                                                    className="flex items-center justify-between gap-1 rounded-md border px-2 py-1.5 text-xs"
                                                                >
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="flex-1 min-w-0 justify-start text-left hover:underline font-medium cursor-pointer"
                                                                                onClick={() => applyTemplate(t)}
                                                                            >
                                                                                <span className="truncate">
                                                                                    {t.name}
                                                                                </span>
                                                                                <span className="text-muted-foreground ml-1 shrink-0 font-mono">
                                                                                    ({t.items.length} item
                                                                                    {t.items.length !== 1 ? "s" : ""})
                                                                                </span>
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>{t.name}</TooltipContent>
                                                                    </Tooltip>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-5 shrink-0 text-destructive hover:text-destructive"
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
                                                        <p className="text-xs text-muted-foreground text-center py-2">
                                                            No templates saved yet
                                                        </p>
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            </div>

                            {/* Quick-add template chips — one tap to load a common sale,
                                only shown before the cart has anything in it */}
                            {!initialData && templates.length > 0 && watchedItems.length === 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/40 p-2">
                                    <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground shrink-0">
                                        <Bookmark className="size-3" />
                                        Quick add:
                                    </span>
                                    {templates.slice(0, 6).map((t) => (
                                        <Tooltip key={t.id}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 max-w-[110px] px-2 text-[11px] sm:max-w-[140px]"
                                                    onClick={() => applyTemplate(t)}
                                                >
                                                    <span className="truncate">{t.name}</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t.name}</TooltipContent>
                                        </Tooltip>
                                    ))}
                                </div>
                            )}

                            <ItemQuantitySelector
                                disabled={isDisabled}
                                items={items}
                                allItems={allItems}
                                stockMap={stockMap.size > 0 ? stockMap : undefined}
                                untrackedItemIds={
                                    untrackedItemIds.size > 0 ? untrackedItemIds : undefined
                                }
                                onAddStock={(itemId) => {
                                    const stock = stockData?.results.find(
                                        (s) => s.item.id === itemId,
                                    )
                                    if (stock) setAddStockDialogStock(stock)
                                }}
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
                                                    onWheel={(e) => e.preventDefault()}
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
                                    <div className="flex flex-wrap items-center justify-between gap-2">
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

                        {/* Summary — the single source of truth for Change/Balance */}
                        <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 sm:p-4 sm:space-y-2">
                            <div className="flex justify-between gap-2 text-xs sm:text-sm">
                                <span className="text-muted-foreground">
                                    {isFreeTransaction ? "Items to deduct" : "Subtotal"} ·{" "}
                                    {watchedItems.length} item
                                    {watchedItems.length !== 1 && "s"}
                                </span>
                                {!isFreeTransaction && (
                                    <AnimatedNumber value={totalItemsAmount} prefix="₱" className="font-medium shrink-0" />
                                )}
                            </div>
                            {!isFreeTransaction && (
                                <>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between gap-2 text-xs sm:text-sm">
                                            <span className="text-muted-foreground">Discount</span>
                                            <AnimatedNumber value={discountAmount} className="font-medium text-destructive shrink-0" prefix="-₱" />
                                        </div>
                                    )}
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between gap-2 text-xs sm:text-sm">
                                            <span className="text-muted-foreground">Total</span>
                                            <AnimatedNumber value={grandTotal} prefix="₱" className="font-medium shrink-0" />
                                        </div>
                                    )}
                                    <div className="flex justify-between gap-2 text-xs sm:text-sm">
                                        <span className="text-muted-foreground">
                                            Paid · {watchedPayments.length} payment
                                            {watchedPayments.length !== 1 && "s"}
                                        </span>
                                        <AnimatedNumber value={totalPayments} prefix="₱" className="font-medium text-primary shrink-0" />
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center gap-2 pt-1">
                                        <span className="text-xs font-semibold sm:text-sm">
                                            {changeDue >= 0 ? "Change" : "Balance Due"}
                                        </span>

                                        <AnimatedNumber value={Math.abs(changeDue)} prefix="₱" className={cn("shrink-0 text-sm font-bold sm:text-lg", { "text-success": changeDue >= 0, "text-destructive": changeDue < 0 })} />

                                    </div>
                                </>
                            )}
                            {isFreeTransaction && (
                                <p className="text-xs text-muted-foreground">
                                    Items will be deducted from stock as free replacements.
                                </p>
                            )}
                        </div>

                        {/* Submit — static at the end of the form. Hold is available
                            as soon as there are items (it's just a draft save), while
                            the real submit button only appears once the sale is
                            actually completable, so seeing it means you're done. */}
                        {!isVoided && (
                            <div className="space-y-2 pt-2">
                                {!initialData && onHeld && watchedItems.length > 0 && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-warning border-warning/30 hover:bg-warning/10 hover:text-warning"
                                                disabled={isSaving}
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
                                                Hold Sale
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Save this sale as a draft to resume later
                                        </TooltipContent>
                                    </Tooltip>
                                )}

                                <AnimatePresence mode="wait">
                                    {showSubmitSection ? (
                                        <motion.div
                                            key="submit-ready"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 32 }}
                                            className="space-y-1"
                                        >
                                            <Button
                                                type="submit"
                                                variant="success"
                                                className="w-full"
                                                disabled={
                                                    isSaving ||
                                                    (!initialData &&
                                                        !heldSale &&
                                                        (!form.formState.isDirty || !form.formState.isValid))
                                                }
                                            >
                                                {isSaving ? (
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                ) : (
                                                    <Save className="mr-2 size-4" />
                                                )}
                                                {isSaving
                                                    ? initialData
                                                        ? "Updating..."
                                                        : "Creating..."
                                                    : initialData
                                                        ? "Update Transaction"
                                                        : transactionType === "replacement"
                                                            ? "Create Replacement"
                                                            : "Create Transaction"}
                                            </Button>
                                            <p className="text-[10px] text-muted-foreground text-center sm:text-xs">
                                                Ctrl + Enter
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.p
                                            key="submit-hint"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="py-2 text-center text-xs text-muted-foreground"
                                        >
                                            {watchedItems.length === 0
                                                ? "Add at least one item to continue"
                                                : "Enter a payment amount to continue"}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </form>
                </Form>
            </div>
            <AlertDialog
                open={showPrintDialog}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        cancelPrint()
                        onClose()
                    }
                }}
            >
                <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
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
                            className="w-full sm:w-auto"
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
                            className="w-full sm:w-auto"
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
                                variant="success"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                    confirmPrint()
                                    const clientId = keepClient ? form.getValues("client_id") : undefined
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

            {/* Add Stall Stock shortcut dialog */}
            <Dialog
                open={!!addStockDialogStock}
                onOpenChange={(v) => !v && setAddStockDialogStock(null)}
            >
                <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Stall Stock</DialogTitle>
                        <DialogDescription>
                            Directly add quantity to stall stock for this item.
                        </DialogDescription>
                    </DialogHeader>
                    {addStockDialogStock && (
                        <AddStockForm
                            stock={addStockDialogStock}
                            onClose={() => setAddStockDialogStock(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Save as Template dialog — separated from the browse popover so
                validation errors and the duplicate-name confirmation have
                proper room instead of being crammed into a small popover row */}
            <Dialog
                open={templateDialogOpen}
                onOpenChange={handleTemplateDialogOpenChange}
            >
                <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Save as Template</DialogTitle>
                        <DialogDescription>
                            Save the {watchedItems.length} item
                            {watchedItems.length !== 1 && "s"} in your cart for quick
                            reuse later.
                        </DialogDescription>
                    </DialogHeader>

                    {itemValidationErrors.length > 0 ? (
                        <Alert variant="destructive">
                            <AlertTitle>Fix these items first</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc space-y-0.5 pl-4 pt-1">
                                    {itemValidationErrors.map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="template-name">Template name</Label>
                                <Input
                                    id="template-name"
                                    value={templateNameInput}
                                    onChange={(e) => {
                                        setTemplateNameInput(e.target.value)
                                        setDuplicateTemplate(null)
                                    }}
                                    placeholder="e.g. Installation Set"
                                    maxLength={TEMPLATE_NAME_MAX_LENGTH}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            handleSaveTemplate()
                                        }
                                    }}
                                />
                                <p className="text-right text-[10px] text-muted-foreground">
                                    {templateNameInput.length}/{TEMPLATE_NAME_MAX_LENGTH}
                                </p>
                            </div>

                            {duplicateTemplate && (
                                <Alert variant="warning">
                                    <AlertTitle>Template already exists</AlertTitle>
                                    <AlertDescription>
                                        A template named &quot;{duplicateTemplate.name}&quot;
                                        already exists with {duplicateTemplate.items.length} item
                                        {duplicateTemplate.items.length !== 1 ? "s" : ""}. Saving
                                        will overwrite it.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => handleTemplateDialogOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        {itemValidationErrors.length === 0 && (
                            <Button
                                type="button"
                                variant={duplicateTemplate ? "destructive" : "success"}
                                className="w-full sm:w-auto"
                                disabled={!templateNameInput.trim()}
                                onClick={handleSaveTemplate}
                            >
                                {duplicateTemplate ? "Overwrite Template" : "Save Template"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
