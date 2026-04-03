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
import type {
  Quotation,
  QuotationPayload,
  QuotationPaymentMethod,
  QuotationType,
} from "@/lib/constants/types"
import { useQuotationMutations } from "@/lib/mutations/useQuotationMutations"
import { useAirconModels, useAirconUnits } from "@/lib/queries/useAircons"
import { useClientChoices } from "@/lib/queries/useChoices"
import { useEmployees } from "@/lib/queries/useEmployees"
import { useQuotationTemplates } from "@/lib/queries/useQuotationTemplates"
import { formatCurrency } from "@/lib/utils/currency"
import { cn } from "@/lib/utils/helpers"
import { addDays, format } from "date-fns"
import {
  Bold,
  CalendarIcon,
  GripVertical,
  Italic,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react"
import { useCallback, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

interface QuotationFormProps {
  quotation?: Quotation
  onClose: () => void
}

interface FormItem {
  id: string
  airconUnitId: number | null
  airconModelId: number | null
  description: string
  qty: number
  price: number
  promoPrice: number | null
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

const AIRCON_TYPE_LABELS: Record<string, string> = {
  window: "WINDOW TYPE",
  split: "SPLIT TYPE",
  floor_mounted: "FLOOR MOUNTED TYPE",
  cassette: "CASSETTE TYPE",
  portable: "PORTABLE",
  centralized: "CENTRALIZED",
}

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
   Description Field — textarea with bold/italic toolbar
   ────────────────────────────────────────────────────────── */

function DescriptionField({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const wrapSelection = (marker: string) => {
    const ta = ref.current
    if (!ta) return
    const { selectionStart: s, selectionEnd: e } = ta
    const selected = value.slice(s, e)
    if (!selected) return
    const wrapped = `${marker}${selected}${marker}`
    const next = value.slice(0, s) + wrapped + value.slice(e)
    onChange(next)
    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(s + marker.length, e + marker.length)
    })
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Label className="text-[11px] text-muted-foreground flex-1">
          Description
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => wrapSelection("**")}
            >
              <Bold className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bold selected text</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => wrapSelection("*")}
            >
              <Italic className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Italic selected text</TooltipContent>
        </Tooltip>
      </div>
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Item description..."
        rows={2}
        className="resize-none text-sm min-h-[60px]"
      />
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

  // ── Selected Client (declared early so aircon query can use it) ──
  const [selectedClientId, setSelectedClientId] = useState<number | null>(
    quotation?.client ?? null,
  )

  // ── Aircon Units (Available Inventory + client's units) ──
  const { data: airconUnitsData } = useAirconUnits({
    limit: 500,
    filter: { is_available_for_sale: "true" },
  })
  const { data: clientUnitsData } = useAirconUnits({
    limit: 500,
    filter: { client: String(selectedClientId) },
    enabled: !!selectedClientId,
  })
  const airconUnits = useMemo(() => {
    const available = airconUnitsData?.results ?? []
    const clientUnits = clientUnitsData?.results ?? []
    // Merge and deduplicate by ID
    const map = new Map(available.map((u) => [u.id, u]))
    for (const u of clientUnits) {
      if (!map.has(u.id)) map.set(u.id, u)
    }
    return Array.from(map.values())
  }, [airconUnitsData, clientUnitsData])
  const airconUnitOptions = useMemo(
    () =>
      airconUnits.map((u) => ({
        value: u.id,
        label:
          `${u.serial_number} — ${u.model?.brand?.name ?? ""} ${u.model?.horsepower ?? ""}hp${u.model?.is_inverter ? " INV" : ""}${u.is_reserved ? " [R]" : ""}${u.installation_service ? " [I]" : ""}`.trim(),
      })),
    [airconUnits],
  )

  // ── Aircon Models (for Price List quotations) ──
  const { data: airconModelsData } = useAirconModels({
    limit: 500,
  })
  const airconModels = useMemo(
    () => airconModelsData?.results ?? [],
    [airconModelsData],
  )
  const airconModelOptions = useMemo(
    () =>
      airconModels.map((m) => ({
        value: m.id,
        label:
          `${m.brand?.name ?? ""} ${m.name} ${m.horsepower ?? ""}hp${m.is_inverter ? " INV" : ""}`.trim(),
      })),
    [airconModels],
  )

  // ── Client ──
  const { data: clientsData } = useClientChoices()
  const clients = useMemo(() => clientsData ?? [], [clientsData])

  // ── Authorized Representatives (admin & managers) ──
  const { data: employeesData } = useEmployees({
    limit: 100,
    filter: { include_admins: "true" },
  })
  const employees = useMemo(() => employeesData?.results ?? [], [employeesData])
  const authorizedRepOptions = useMemo(
    () =>
      employees
        .filter((e) => e.role === "admin" || e.role === "manager")
        .map((e) => ({
          value: e.id,
          label: e.full_name || `${e.first_name} ${e.last_name}`.trim(),
        })),
    [employees],
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

  // ── Quotation Type ──
  const [quotationType, setQuotationType] = useState<QuotationType>(
    quotation?.quotation_type ?? "standard",
  )
  const isPriceList = quotationType === "price_list"

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

  // Payment Schedule (structured payments with value, date, receipt#)
  interface PaymentRecord {
    id: string
    label: string
    amount: number
    payment_method: string
    payment_date: Date | undefined
    reference_number: string
    si_number: string
  }
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(() => {
    if (quotation?.payments?.length) {
      return quotation.payments.map((p) => ({
        id: generateId(),
        label: p.label,
        amount: Number(p.amount),
        payment_method: p.payment_method ?? "",
        payment_date: p.payment_date ? new Date(p.payment_date) : undefined,
        reference_number: p.reference_number ?? "",
        si_number: p.si_number ?? "",
      }))
    }
    return []
  })

  const addPayment = () => {
    setPaymentRecords((prev) => [
      ...prev,
      {
        id: generateId(),
        label: "",
        amount: 0,
        payment_method: "cash",
        payment_date: undefined,
        reference_number: "",
        si_number: "",
      },
    ])
  }

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
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null)

  // Resolve selectedRepId from authorized_name when editing
  const resolvedRepRef = useRef(false)
  if (
    isEdit &&
    !resolvedRepRef.current &&
    authorizedRepOptions.length > 0 &&
    quotation?.authorized_name
  ) {
    const match = authorizedRepOptions.find(
      (o) => o.label.toLowerCase() === quotation.authorized_name.toLowerCase(),
    )
    if (match) {
      resolvedRepRef.current = true
      // Use queueMicrotask to avoid setState during render
      queueMicrotask(() => setSelectedRepId(match.value as number))
    }
  }

  // ── Line Items ──
  const [items, setItems] = useState<FormItem[]>(
    quotation?.items?.length
      ? quotation.items.map((i) => ({
          id: generateId(),
          airconUnitId: i.aircon_unit ?? null,
          airconModelId: i.aircon_model ?? null,
          description: i.description,
          qty: i.quantity,
          price: Number(i.unit_price),
          promoPrice: i.promo_price != null ? Number(i.promo_price) : null,
        }))
      : [
          {
            id: generateId(),
            airconUnitId: null,
            airconModelId: null,
            description: "",
            qty: 1,
            price: 0,
            promoPrice: null,
          },
        ],
  )

  // ── Notes ──
  const DEFAULT_NOTES =
    "1 Year Warranty Parts / 5 Years Warranty Compressor / 3 Years PCB Board (Daikin)"
  const [notes, setNotes] = useState(
    quotation?.notes ?? (isEdit ? "" : DEFAULT_NOTES),
  )
  const notesRef = useRef<HTMLTextAreaElement>(null)

  const wrapNotesSelection = useCallback(
    (marker: string) => {
      const ta = notesRef.current
      if (!ta) return
      const { selectionStart: s, selectionEnd: e } = ta
      const selected = notes.slice(s, e)
      if (!selected) return
      const wrapped = `${marker}${selected}${marker}`
      setNotes(notes.slice(0, s) + wrapped + notes.slice(e))
      requestAnimationFrame(() => {
        ta.focus()
        ta.setSelectionRange(s + marker.length, e + marker.length)
      })
    },
    [notes],
  )

  /** Get options for a specific item, excluding units already selected by other items */
  const getUnitOptionsForItem = useCallback(
    (currentItemId: string) => {
      const selectedByOthers = new Set(
        items
          .filter((i) => i.id !== currentItemId && i.airconUnitId != null)
          .map((i) => i.airconUnitId),
      )
      return airconUnitOptions.filter((o) => !selectedByOthers.has(o.value))
    },
    [items, airconUnitOptions],
  )

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        id: generateId(),
        airconUnitId: null,
        airconModelId: null,
        description: "",
        qty: 1,
        price: 0,
        promoPrice: null,
      },
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

  const handleAirconUnitSelect = useCallback(
    (itemId: string, unitId: number | null) => {
      const unit = airconUnits.find((u) => u.id === unitId)
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item
          if (!unit) return { ...item, airconUnitId: null }
          const model = unit.model
          const typeLabel = model
            ? (AIRCON_TYPE_LABELS[model.aircon_type] ?? model.aircon_type)
            : ""
          const desc =
            `${model?.brand?.name ?? ""} ${typeLabel} ${model?.horsepower ?? ""}hp${model?.is_inverter ? "\nINVERTER" : ""}\n${model?.name ?? ""}\nSerial: ${unit.serial_number}${unit.outdoor_serial_number ? ` / ${unit.outdoor_serial_number}` : ""}`.trim()
          return {
            ...item,
            airconUnitId: unit.id,
            description: desc,
            qty: 1,
            price: Number(model?.retail_price ?? model?.selling_price ?? 0),
            promoPrice: model?.selling_price
              ? Number(model.selling_price)
              : null,
          }
        }),
      )
    },
    [airconUnits],
  )

  const handleAirconUnitClear = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              airconUnitId: null,
              description: "",
              price: 0,
              qty: 1,
              promoPrice: null,
            }
          : item,
      ),
    )
  }, [])

  // ── Aircon Model handlers (for Price List) ──
  const handleAirconModelSelect = useCallback(
    (itemId: string, modelId: number | null) => {
      const model = airconModels.find((m) => m.id === modelId)
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item
          if (!model) return { ...item, airconModelId: null }
          const desc =
            `${model.brand?.name ?? ""}\n${model.is_inverter ? "Inverter" : "Non-Inverter"}\n${model.horsepower ?? ""}HP\n${model.name}`.trim()
          return {
            ...item,
            airconModelId: model.id,
            description: desc,
            qty: 1,
            price: Number(model.retail_price ?? model.selling_price ?? 0),
            promoPrice: model.selling_price
              ? Number(model.selling_price)
              : null,
          }
        }),
      )
    },
    [airconModels],
  )

  const handleAirconModelClear = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              airconModelId: null,
              description: "",
              price: 0,
              qty: 1,
              promoPrice: null,
            }
          : item,
      ),
    )
  }, [])

  // ── Authorized Representative handler ──
  const handleAuthorizedRepSelect = useCallback(
    (empId: number | null) => {
      setSelectedRepId(empId)
      if (!empId) return
      const emp = employees.find((e) => e.id === empId)
      if (!emp) return
      setAuthorizedName(
        emp.full_name || `${emp.first_name} ${emp.last_name}`.trim(),
      )
      setAuthorizedSignature(emp.e_signature ?? "")
      if (!authorizedDate) setAuthorizedDate(format(quoteDate, "yyyy-MM-dd"))
    },
    [employees, authorizedDate, quoteDate],
  )

  // ── Template handlers ──
  const [termsTemplateKey, setTermsTemplateKey] = useState(0)
  const [paymentTemplateKey, setPaymentTemplateKey] = useState(0)

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
    if (!isPriceList && validItems.some((i) => i.price <= 0))
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
      quotation_type: quotationType,
      discount_amount: isPriceList ? 0 : discountAmount,
      terms_conditions: arrayToLines(termsLines),
      payment_terms: arrayToLines(paymentLines),
      notes,
      authorized_signature: authorizedSignature,
      client_signature: clientSignature,
      authorized_name: authorizedName,
      authorized_date: authorizedDate || undefined,
      client_acceptance_name: clientAcceptanceName,
      client_acceptance_date: clientAcceptanceDate || undefined,
      items: items
        .filter((i) => i.description.trim())
        .map((i) => ({
          aircon_unit: isPriceList ? undefined : i.airconUnitId || undefined,
          aircon_model: isPriceList ? i.airconModelId || undefined : undefined,
          description: i.description,
          quantity: isPriceList ? 1 : i.qty,
          unit_price: i.price,
          promo_price: isPriceList ? i.promoPrice || null : null,
        })),
      payments: isPriceList
        ? []
        : paymentRecords
            .filter((p) => p.label.trim())
            .map((p) => ({
              label: p.label,
              amount: p.amount,
              payment_method: (p.payment_method || "") as
                | QuotationPaymentMethod
                | "",
              payment_date: p.payment_date
                ? format(p.payment_date, "yyyy-MM-dd")
                : null,
              reference_number: p.reference_number,
              si_number: p.si_number,
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Quotation Type
            </Label>
            <Select
              value={quotationType}
              onValueChange={(v) => setQuotationType(v as QuotationType)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="price_list">Price List</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
        <div className="mt-4 space-y-1.5 max-w-3xl">
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
                variant="success"
                size="sm"
                onClick={addItem}
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

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Item {idx + 1}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove item</TooltipContent>
                </Tooltip>
              </div>
              {isPriceList ? (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Aircon Model{" "}
                    <span className="text-[10px]">
                      (optional — auto-fills description & price)
                    </span>
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1">
                      <ComboBox
                        options={airconModelOptions}
                        value={item.airconModelId}
                        onChange={(v) =>
                          handleAirconModelSelect(item.id, v as number | null)
                        }
                        placeholder="Select aircon model..."
                        searchPlaceholder="Search brand, model, HP..."
                      />
                    </div>
                    {item.airconModelId && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleAirconModelClear(item.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove selected model</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Aircon Unit{" "}
                    <span className="text-[10px]">
                      (optional — auto-fills description & price)
                    </span>
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1">
                      <ComboBox
                        options={getUnitOptionsForItem(item.id)}
                        value={item.airconUnitId}
                        onChange={(v) =>
                          handleAirconUnitSelect(item.id, v as number | null)
                        }
                        placeholder="Select aircon unit..."
                        searchPlaceholder="Search serial, brand, model..."
                      />
                    </div>
                    {item.airconUnitId && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleAirconUnitClear(item.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove selected unit</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              )}
              <div
                className={cn(
                  "grid gap-2",
                  isPriceList
                    ? "grid-cols-1 sm:grid-cols-[1fr_150px_150px]"
                    : item.airconUnitId
                      ? "grid-cols-1 md:grid-cols-[1fr_180px] lg:grid-cols-[1fr_200px]"
                      : "grid-cols-1 sm:grid-cols-[1fr_90px] md:grid-cols-[1fr_90px_180px] lg:grid-cols-[1fr_90px_200px]",
                )}
              >
                <DescriptionField
                  value={item.description}
                  onChange={(v) => updateItem(item.id, "description", v)}
                />
                {!isPriceList && !item.airconUnitId && (
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Qty
                    </Label>
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
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">
                    {isPriceList ? "Retail Price" : "Price"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.price || ""}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "price",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="0.00"
                    className="h-9"
                  />
                </div>
                {isPriceList && (
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Promo Price
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.promoPrice ?? ""}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "promoPrice",
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="0.00"
                      className="h-9"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground flex-1">
              Note/s{" "}
              <span className="text-[10px]">
                (displayed below items, e.g. warranty info)
              </span>
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => wrapNotesSelection("**")}
                >
                  <Bold className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold selected text</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => wrapNotesSelection("*")}
                >
                  <Italic className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic selected text</TooltipContent>
            </Tooltip>
          </div>
          <Textarea
            ref={notesRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. 1 Year Warranty Parts / 5 Years Warranty Compressor"
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Totals */}
        {!isPriceList && (
          <div className="mt-4 ml-auto w-full sm:w-[320px] md:w-[360px] lg:w-[400px] space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
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
                className="w-32 sm:w-40 md:w-44 h-8 text-right text-sm"
              />
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-base text-success">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </section>

      <Separator />

      {/* ── Section: Payment Schedule ─────────────────────── */}
      {!isPriceList && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              Payment Schedule
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs border-dashed text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              onClick={addPayment}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Payment
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Track downpayment, completion payment, etc. These will appear on the
            printed quotation.
          </p>
          <div className="space-y-3">
            {paymentRecords.length === 0 && (
              <div className="text-xs text-muted-foreground border border-dashed rounded-md p-4 text-center">
                No payment schedule yet.
                <div className="mt-2">
                  Click <span className="font-medium">Add Payment</span> to
                  create one.
                </div>
              </div>
            )}
            {paymentRecords.map((rec) => (
              <div
                key={rec.id}
                className="group border rounded-md p-3 bg-muted/30 space-y-2"
              >
                {/* Row 1: Label + Amount + Delete */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_32px] md:grid-cols-[1fr_180px_32px] lg:grid-cols-[1fr_200px_32px] gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Label
                    </Label>
                    <Input
                      value={rec.label}
                      onChange={(e) =>
                        setPaymentRecords((prev) =>
                          prev.map((r) =>
                            r.id === rec.id
                              ? { ...r, label: e.target.value }
                              : r,
                          ),
                        )
                      }
                      placeholder="e.g. Down payment, Full payment"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Amount (₱)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={rec.amount || ""}
                      onChange={(e) =>
                        setPaymentRecords((prev) =>
                          prev.map((r) =>
                            r.id === rec.id
                              ? {
                                  ...r,
                                  amount: parseFloat(e.target.value) || 0,
                                }
                              : r,
                          ),
                        )
                      }
                      placeholder="0.00"
                      className="h-8 text-sm"
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive self-end"
                        onClick={() =>
                          setPaymentRecords((prev) =>
                            prev.filter((r) => r.id !== rec.id),
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove payment</TooltipContent>
                  </Tooltip>
                </div>
                {/* Row 2: Payment Method + Date + Ref No. + S.I. No. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Payment Method
                    </Label>
                    <Select
                      value={rec.payment_method}
                      onValueChange={(v) =>
                        setPaymentRecords((prev) =>
                          prev.map((r) =>
                            r.id === rec.id ? { ...r, payment_method: v } : r,
                          ),
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="gcash">GCash</SelectItem>
                        <SelectItem value="bank_transfer">
                          Bank Transfer
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-8 text-sm",
                            !rec.payment_date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                          {rec.payment_date
                            ? format(rec.payment_date, "MM/dd/yyyy")
                            : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={rec.payment_date}
                          onSelect={(d) =>
                            setPaymentRecords((prev) =>
                              prev.map((r) =>
                                r.id === rec.id ? { ...r, payment_date: d } : r,
                              ),
                            )
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Ref No.
                    </Label>
                    <Input
                      value={rec.reference_number}
                      onChange={(e) =>
                        setPaymentRecords((prev) =>
                          prev.map((r) =>
                            r.id === rec.id
                              ? { ...r, reference_number: e.target.value }
                              : r,
                          ),
                        )
                      }
                      placeholder="Reference #"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      S.I. No.
                    </Label>
                    <Input
                      value={rec.si_number}
                      onChange={(e) =>
                        setPaymentRecords((prev) =>
                          prev.map((r) =>
                            r.id === rec.id
                              ? { ...r, si_number: e.target.value }
                              : r,
                          ),
                        )
                      }
                      placeholder="Sales Invoice #"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Separator />

      {/* ── Section: Terms & Conditions ───────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            Terms & Conditions
          </h3>
          <div className="flex items-center gap-1.5">
            {termsTemplates.length > 0 && (
              <Select
                key={termsTemplateKey}
                onValueChange={applyTermsTemplate}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SelectTrigger className="w-36 sm:w-44 h-7 text-xs">
                      <SelectValue
                        placeholder={
                          termsLines.length > 0
                            ? "Change template..."
                            : "Load template..."
                        }
                      />
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setTermsLines([...DEFAULT_TERMS])
                    setTermsTemplateKey((k) => k + 1)
                  }}
                >
                  <X className="mr-1 h-3 w-3" />
                  Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset to default terms</TooltipContent>
            </Tooltip>
          </div>
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
          <div className="flex items-center gap-1.5">
            {paymentTemplates.length > 0 && (
              <Select
                key={paymentTemplateKey}
                onValueChange={applyPaymentTemplate}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SelectTrigger className="w-36 sm:w-44 h-7 text-xs">
                      <SelectValue
                        placeholder={
                          paymentLines.length > 0
                            ? "Change template..."
                            : "Load template..."
                        }
                      />
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setPaymentLines([...DEFAULT_PAYMENT_TERMS])
                    setPaymentTemplateKey((k) => k + 1)
                  }}
                >
                  <X className="mr-1 h-3 w-3" />
                  Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset to default payment terms</TooltipContent>
            </Tooltip>
          </div>
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
        <h3 className="text-sm font-semibold text-foreground mb-4">
          E-Signatures
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ─ Authorized Representative Card ─ */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold text-foreground tracking-wide uppercase">
              Authorized Representative
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Select Representative
              </Label>
              <ComboBox
                options={authorizedRepOptions}
                value={selectedRepId}
                onChange={(v) => handleAuthorizedRepSelect(v as number | null)}
                placeholder="Select representative..."
                searchPlaceholder="Search by name..."
              />
            </div>
            <SignatureInput
              label="Signature"
              value={authorizedSignature}
              onChange={setAuthorizedSignature}
            />
            <div className="grid gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Printed Name
                </Label>
                <Input
                  value={authorizedName}
                  onChange={(e) => setAuthorizedName(e.target.value)}
                  placeholder="Full name..."
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Date
                </Label>
                <div className="flex items-center gap-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal h-8 text-xs",
                          !authorizedDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-1.5 h-3 w-3 text-muted-foreground" />
                        {authorizedDate
                          ? format(new Date(authorizedDate), "MMM dd, yyyy")
                          : "Pick date"}
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
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─ Client Acceptance Card ─ */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold text-foreground tracking-wide uppercase">
              Client Acceptance
            </p>
            <SignatureInput
              label="Signature"
              value={clientSignature}
              onChange={setClientSignature}
            />
            <div className="grid gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Printed Name
                </Label>
                <Input
                  value={clientAcceptanceName}
                  onChange={(e) => setClientAcceptanceName(e.target.value)}
                  placeholder="Full name..."
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Date
                </Label>
                <div className="flex items-center gap-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal h-8 text-xs",
                          !clientAcceptanceDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-1.5 h-3 w-3 text-muted-foreground" />
                        {clientAcceptanceDate
                          ? format(
                              new Date(clientAcceptanceDate),
                              "MMM dd, yyyy",
                            )
                          : "Pick date"}
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
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
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
              variant="destructive"
              onClick={onClose}
              disabled={isSubmitting}
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
