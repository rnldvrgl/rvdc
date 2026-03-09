"use client"

import { ComboBox } from "@/components/custom/inputs/ComboBox"
import SignatureInput from "@/components/forms/SignatureInput"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Quotation, QuotationPayload } from "@/lib/constants/types"
import { useQuotationMutations } from "@/lib/mutations/useQuotationMutations"
import { useClients } from "@/lib/queries/clients/useClients"
import { useQuotationTemplates } from "@/lib/queries/useQuotationTemplates"
import { formatCurrency } from "@/lib/utils/currency"
import { cn } from "@/lib/utils/helpers"
import { addDays, format } from "date-fns"
import {
  CalendarIcon,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

interface QuotationFormProps {
  quotation?: Quotation
  onClose: () => void
}

interface FormItem {
  id: string
  description: string
  qty: number
  price: number
}

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

/** Parse newline-delimited string into array of lines */
function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
}

/** Join array of lines back to newline-delimited string */
function arrayToLines(arr: string[]): string {
  return arr.join("\n")
}

const DEFAULT_TERMS = [
  "Prices are provisional and subject to change based on final requirements and specifications.",
  "Payment terms: 50% downpayment, 50% upon job completion.",
  "Warranty/Guarantee: if applicable.",
  "Free Installation for 1st 10ft. and Free 1 Time Cleaning Valid for 1 year upon job completion.",
]

const DEFAULT_PAYMENT_TERMS = [
  "All payments must be made within 7 business days of quote date.",
  "50% downpayment, 50% upon job completion.",
  "Accepted payment methods: Bank Transfer, GCash, Cash.",
]

/* ──────────────────────────────────────────────────────────
   Editable Lines Component — per-line inputs with add/remove
   ────────────────────────────────────────────────────────── */

function EditableLines({
  lines,
  onChange,
  placeholder,
}: {
  lines: string[]
  onChange: (lines: string[]) => void
  placeholder?: string
}) {
  const updateLine = (index: number, value: string) => {
    const next = [...lines]
    next[index] = value
    onChange(next)
  }

  const removeLine = (index: number) => {
    onChange(lines.filter((_, i) => i !== index))
  }

  const addLine = () => {
    onChange([...lines, ""])
  }

  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => (
        <div
          key={idx}
          className="group flex items-center gap-1.5"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          <Input
            value={line}
            onChange={(e) => updateLine(idx, e.target.value)}
            placeholder={placeholder || `Line ${idx + 1}...`}
            className="h-8 text-sm flex-1"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                onClick={() => removeLine(idx)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove this line</TooltipContent>
          </Tooltip>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addLine}
        className="h-7 text-xs mt-1 border-dashed text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700"
      >
        <Plus className="mr-1 h-3 w-3" />
        Add Line
      </Button>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   Main QuotationForm
   ────────────────────────────────────────────────────────── */

export default function QuotationForm({
  quotation,
  onClose,
}: QuotationFormProps) {
  const isEdit = !!quotation

  // ── Client ──
  const { data: clientsData } = useClients({ limit: 200 })
  const clients = useMemo(() => clientsData?.results ?? [], [clientsData])
  const [selectedClientId, setSelectedClientId] = useState<number | null>(
    quotation?.client ?? null,
  )
  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.full_name })),
    [clients],
  )

  // ── Client override fields ──
  const [clientNameOverride, setClientNameOverride] = useState(
    quotation?.client_name ?? "",
  )
  const [clientAddressOverride, setClientAddressOverride] = useState(
    quotation?.client_address ?? "",
  )
  const [clientContactOverride, setClientContactOverride] = useState(
    quotation?.client_contact ?? "",
  )

  // Sync overrides when client selection changes
  const handleClientChange = (v: number | null) => {
    setSelectedClientId(v as number | null)
    const c = clients.find((cl) => cl.id === v)
    if (c) {
      setClientNameOverride(c.full_name)
      setClientContactOverride(c.contact_number ?? "")
      setClientAddressOverride(
        [c.address, c.barangay, c.city, c.province].filter(Boolean).join(", "),
      )
    }
  }

  // ── Templates ──
  const { data: allTemplates } = useQuotationTemplates()
  const termsTemplates = useMemo(
    () => (allTemplates ?? []).filter((t) => t.category === "terms_conditions"),
    [allTemplates],
  )
  const paymentTemplates = useMemo(
    () => (allTemplates ?? []).filter((t) => t.category === "payment_terms"),
    [allTemplates],
  )

  // ── Form state ──
  const [quoteDate, setQuoteDate] = useState<Date>(
    quotation?.quote_date ? new Date(quotation.quote_date) : new Date(),
  )
  const [validUntil, setValidUntil] = useState<Date>(
    quotation?.valid_until
      ? new Date(quotation.valid_until)
      : addDays(new Date(), 30),
  )
  const [projectDescription, setProjectDescription] = useState(
    quotation?.project_description ?? "",
  )
  const [discountAmount, setDiscountAmount] = useState<number>(
    quotation?.discount_amount ?? 0,
  )

  // Terms as arrays of strings
  const [termsLines, setTermsLines] = useState<string[]>(
    quotation?.terms_conditions
      ? linesToArray(quotation.terms_conditions)
      : DEFAULT_TERMS,
  )
  const [paymentLines, setPaymentLines] = useState<string[]>(
    quotation?.payment_terms
      ? linesToArray(quotation.payment_terms)
      : DEFAULT_PAYMENT_TERMS,
  )

  // Signatures
  const [authorizedSignature, setAuthorizedSignature] = useState(
    quotation?.authorized_signature ?? "",
  )
  const [clientSignature, setClientSignature] = useState(
    quotation?.client_signature ?? "",
  )

  // Signature printed names & dates
  const [authorizedName, setAuthorizedName] = useState(
    quotation?.authorized_name ?? "",
  )
  const [authorizedDate, setAuthorizedDate] = useState(
    quotation?.authorized_date ?? "",
  )
  const [clientAcceptanceName, setClientAcceptanceName] = useState(
    quotation?.client_acceptance_name ?? "",
  )
  const [clientAcceptanceDate, setClientAcceptanceDate] = useState(
    quotation?.client_acceptance_date ?? "",
  )

  // ── Line Items ──
  const [items, setItems] = useState<FormItem[]>(
    quotation?.items?.length
      ? quotation.items.map((i) => ({
          id: generateId(),
          description: i.description,
          qty: i.quantity,
          price: Number(i.unit_price),
        }))
      : [{ id: generateId(), description: "", qty: 1, price: 0 }],
  )

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { id: generateId(), description: "", qty: 1, price: 0 },
    ])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.length > 1 ? prev.filter((i) => i.id !== id) : prev,
    )
  }, [])

  const updateItem = useCallback(
    (id: string, field: keyof Omit<FormItem, "id">, value: string | number) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      )
    },
    [],
  )

  // ── Template handlers ──
  const applyTermsTemplate = (templateId: string) => {
    const tpl = termsTemplates.find((t) => t.id === Number(templateId))
    if (tpl) setTermsLines([...tpl.lines])
  }

  const applyPaymentTemplate = (templateId: string) => {
    const tpl = paymentTemplates.find((t) => t.id === Number(templateId))
    if (tpl) setPaymentLines([...tpl.lines])
  }

  // ── Calculations ──
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0)
  const total = Math.max(0, subtotal - discountAmount)

  // ── Mutations ──
  const { addQuotation, updateQuotation } = useQuotationMutations()

  const handleSubmit = () => {
    // ── Validation ──
    const errors: string[] = []
    if (!selectedClientId) errors.push("Please select a client.")
    const validItems = items.filter((i) => i.description.trim())
    if (validItems.length === 0)
      errors.push("Add at least one line item with a description.")
    if (validItems.some((i) => i.price <= 0))
      errors.push("All items must have a price greater than 0.")
    if (!quoteDate) errors.push("Quote date is required.")
    if (!validUntil) errors.push("Valid until date is required.")

    if (errors.length > 0) {
      errors.forEach((e) => toast.error(e))
      return
    }

    const payload: QuotationPayload = {
      client: selectedClientId,
      client_name: clientNameOverride,
      client_address: clientAddressOverride,
      client_contact: clientContactOverride,
      quote_date: format(quoteDate, "yyyy-MM-dd"),
      valid_until: format(validUntil, "yyyy-MM-dd"),
      project_description: projectDescription,
      discount_amount: discountAmount,
      terms_conditions: arrayToLines(termsLines),
      payment_terms: arrayToLines(paymentLines),
      authorized_signature: authorizedSignature,
      client_signature: clientSignature,
      authorized_name: authorizedName,
      authorized_date: authorizedDate || undefined,
      client_acceptance_name: clientAcceptanceName,
      client_acceptance_date: clientAcceptanceDate || undefined,
      items: items
        .filter((i) => i.description.trim())
        .map((i) => ({
          description: i.description,
          quantity: i.qty,
          unit_price: i.price,
        })),
    }

    if (isEdit && quotation) {
      updateQuotation.mutate(
        { id: quotation.id, data: payload },
        { onSuccess: onClose },
      )
    } else {
      addQuotation.mutate(payload, { onSuccess: onClose })
    }
  }

  const isSubmitting = addQuotation.isPending || updateQuotation.isPending

  return (
    <div className="space-y-6">
      {/* ── Section: Client ───────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Client Information
        </h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Client</Label>
            <ComboBox
              options={clientOptions}
              value={selectedClientId}
              onChange={(v) => handleClientChange(v as number | null)}
              placeholder="Select client..."
              searchPlaceholder="Search client name..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Client Name
              </Label>
              <Input
                value={clientNameOverride}
                onChange={(e) => setClientNameOverride(e.target.value)}
                placeholder="Client name..."
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Contact Number
              </Label>
              <Input
                value={clientContactOverride}
                onChange={(e) => setClientContactOverride(e.target.value)}
                placeholder="Contact number..."
                className="h-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Address</Label>
            <Textarea
              value={clientAddressOverride}
              onChange={(e) => setClientAddressOverride(e.target.value)}
              placeholder="Client address..."
              rows={2}
              className="resize-none"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Section: Quote Details ────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Quote Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Quote Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-9",
                    !quoteDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  {format(quoteDate, "MMM dd, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={quoteDate}
                  onSelect={(d) => d && setQuoteDate(d)}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Valid Until</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-9",
                    !validUntil && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  {format(validUntil, "MMM dd, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={validUntil}
                  onSelect={(d) => d && setValidUntil(d)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Project Description
          </Label>
          <Textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="Brief description of the project scope..."
            rows={2}
            className="resize-none"
          />
        </div>
      </section>

      <Separator />

      {/* ── Section: Line Items ───────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Line Items</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={addItem}
                className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Item
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Add a new line item to the quotation
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Header (desktop) */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_70px_110px_36px] gap-2 mb-1.5 px-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Description
          </span>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Qty
          </span>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Price
          </span>
          <span />
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col gap-2 rounded-md border border-border/60 bg-muted/30 p-2.5 sm:grid sm:grid-cols-[1fr_70px_110px_36px] sm:gap-2 sm:items-center sm:border-0 sm:bg-transparent sm:p-0 sm:rounded-none"
            >
              <Input
                value={item.description}
                onChange={(e) =>
                  updateItem(item.id, "description", e.target.value)
                }
                placeholder="Item description..."
                className="h-9"
              />
              <Input
                type="number"
                min={1}
                value={item.qty}
                onChange={(e) =>
                  updateItem(
                    item.id,
                    "qty",
                    Math.max(1, parseInt(e.target.value) || 1),
                  )
                }
                className="h-9"
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                value={item.price || ""}
                onChange={(e) =>
                  updateItem(item.id, "price", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                className="h-9"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive opacity-60 hover:opacity-100"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove item</TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 ml-auto w-full sm:w-72 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>&#8369;{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Discount</span>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={discountAmount || ""}
              onChange={(e) =>
                setDiscountAmount(parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
              className="w-28 h-8 text-right text-sm"
            />
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-base text-emerald-700">
            <span>Total</span>
            <span>&#8369;{formatCurrency(total)}</span>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Section: Terms & Conditions ───────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            Terms & Conditions
          </h3>
          {termsTemplates.length > 0 && (
            <Select onValueChange={applyTermsTemplate}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SelectTrigger className="w-44 h-7 text-xs">
                    <SelectValue placeholder="Load template..." />
                  </SelectTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Select a template to pre-fill terms. You can still edit
                  individual lines after.
                </TooltipContent>
              </Tooltip>
              <SelectContent>
                {termsTemplates.map((t) => (
                  <SelectItem
                    key={t.id}
                    value={String(t.id)}
                  >
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <EditableLines
          lines={termsLines}
          onChange={setTermsLines}
          placeholder="Enter a term or condition..."
        />
      </section>

      <Separator />

      {/* ── Section: Payment Terms ────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            Payment Terms
          </h3>
          {paymentTemplates.length > 0 && (
            <Select onValueChange={applyPaymentTemplate}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SelectTrigger className="w-44 h-7 text-xs">
                    <SelectValue placeholder="Load template..." />
                  </SelectTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Select a template to pre-fill payment terms
                </TooltipContent>
              </Tooltip>
              <SelectContent>
                {paymentTemplates.map((t) => (
                  <SelectItem
                    key={t.id}
                    value={String(t.id)}
                  >
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <EditableLines
          lines={paymentLines}
          onChange={setPaymentLines}
          placeholder="Enter a payment term..."
        />
      </section>

      <Separator />

      {/* ── Section: Signatures ───────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          E-Signatures{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (optional — draw or upload an image)
          </span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <SignatureInput
              label="Authorized Representative"
              value={authorizedSignature}
              onChange={setAuthorizedSignature}
            />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Printed Name
              </Label>
              <Input
                value={authorizedName}
                onChange={(e) => setAuthorizedName(e.target.value)}
                placeholder="Full name..."
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <div className="flex items-center gap-1.5">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal h-8 text-sm",
                        !authorizedDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      {authorizedDate
                        ? format(new Date(authorizedDate), "MMM dd, yyyy")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={
                        authorizedDate ? new Date(authorizedDate) : undefined
                      }
                      onSelect={(d) =>
                        setAuthorizedDate(d ? format(d, "yyyy-MM-dd") : "")
                      }
                    />
                  </PopoverContent>
                </Popover>
                {authorizedDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setAuthorizedDate("")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <SignatureInput
              label="Client Acceptance"
              value={clientSignature}
              onChange={setClientSignature}
            />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Printed Name
              </Label>
              <Input
                value={clientAcceptanceName}
                onChange={(e) => setClientAcceptanceName(e.target.value)}
                placeholder="Full name..."
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <div className="flex items-center gap-1.5">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal h-8 text-sm",
                        !clientAcceptanceDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      {clientAcceptanceDate
                        ? format(new Date(clientAcceptanceDate), "MMM dd, yyyy")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={
                        clientAcceptanceDate
                          ? new Date(clientAcceptanceDate)
                          : undefined
                      }
                      onSelect={(d) =>
                        setClientAcceptanceDate(
                          d ? format(d, "yyyy-MM-dd") : "",
                        )
                      }
                    />
                  </PopoverContent>
                </Popover>
                {clientAcceptanceDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setClientAcceptanceDate("")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Actions ───────────────────────────────────────── */}
      <div className="flex justify-end gap-2 pt-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <X className="mr-1.5 h-4 w-4" />
              Cancel
            </Button>
          </TooltipTrigger>
          <TooltipContent>Discard changes and close</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              {isEdit ? "Update Quotation" : "Create Quotation"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isEdit
              ? "Save changes to this quotation"
              : "Create a new quotation"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
