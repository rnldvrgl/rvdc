"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Quotation, QuotationStatus } from "@/lib/constants/types"
import { useQuotationMutations } from "@/lib/mutations/useQuotationMutations"
import { useQuotation } from "@/lib/queries/useQuotations"
import { formatCurrency } from "@/lib/utils/currency"
import { cn } from "@/lib/utils/helpers"
import { format } from "date-fns"
import { Check, FileEdit, Loader2, Printer, Send, XCircle } from "lucide-react"
import React, { useRef } from "react"
import { useReactToPrint } from "react-to-print"

/** Render **bold** and *italic* markers as <strong>/<em> React elements */
function renderFormattedText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Match **bold** first, then *italic*
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[2]) {
      parts.push(<strong key={key++}>{match[2]}</strong>)
    } else if (match[4]) {
      parts.push(<em key={key++}>{match[4]}</em>)
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts
}

const STATUS_OPTIONS: {
  value: QuotationStatus
  label: string
  icon: React.ElementType
  activeClass: string
}[] = [
  {
    value: "draft",
    label: "Draft",
    icon: FileEdit,
    activeClass: "bg-zinc-700! text-white! border-zinc-700!",
  },
  {
    value: "sent",
    label: "Sent",
    icon: Send,
    activeClass: "bg-purple-600! text-white! border-purple-600!",
  },
  {
    value: "accepted",
    label: "Accepted",
    icon: Check,
    activeClass: "bg-emerald-600! text-white! border-emerald-600!",
  },
  {
    value: "declined",
    label: "Declined",
    icon: XCircle,
    activeClass: "bg-red-600! text-white! border-red-600!",
  },
]

interface QuotationViewSheetProps {
  open: boolean
  onClose: () => void
  quotation: Quotation
}

export default function QuotationViewSheet({
  open,
  onClose,
  quotation: listData,
}: QuotationViewSheetProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const { updateQuotation } = useQuotationMutations()

  // Fetch full detail (with items, signatures, terms) by ID
  const { data: detail, isLoading: detailLoading } = useQuotation(
    String(listData.id),
  )
  const q = detail || listData

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Quotation_${q.client_name || "Draft"}_${q.quote_date}`,
  })

  const handleStatusChange = (status: QuotationStatus) => {
    updateQuotation.mutate({
      id: q.id,
      data: {
        client: q.client,
        client_name: q.client_name,
        client_address: q.client_address,
        client_contact: q.client_contact,
        quote_date: q.quote_date,
        valid_until: q.valid_until,
        project_description: q.project_description,
        discount_amount: q.discount_amount,
        terms_conditions: q.terms_conditions,
        payment_terms: q.payment_terms,
        notes: q.notes,
        status,
        authorized_signature: q.authorized_signature,
        client_signature: q.client_signature,
        authorized_name: q.authorized_name,
        authorized_date: q.authorized_date || undefined,
        client_acceptance_name: q.client_acceptance_name,
        client_acceptance_date: q.client_acceptance_date || undefined,
        items: (q.items ?? []).map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
      },
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <SheetContent
        side="right"
        className="max-w-4xl! w-full px-6 sm:px-8 py-8 overflow-y-auto"
      >
        <SheetHeader className="mb-5 pb-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-semibold">
                Quotation Preview
              </SheetTitle>
              <SheetDescription>
                View, print, or update the status of this quotation.
              </SheetDescription>
            </div>
            <Button
              onClick={() => handlePrint()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
          <div className="flex items-center gap-2 pt-3 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground mr-1">
              Status:
            </span>
            {STATUS_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const isActive = q.status === opt.value
              return (
                <Button
                  key={opt.value}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 px-3 text-xs font-medium transition-all",
                    isActive
                      ? opt.activeClass
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => !isActive && handleStatusChange(opt.value)}
                >
                  <Icon className="mr-1.5 h-3.5 w-3.5" />
                  {opt.label}
                </Button>
              )
            })}
          </div>
        </SheetHeader>

        {/* A4 Preview */}
        {detailLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading quotation details...
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="overflow-auto max-h-[calc(100vh-14rem)]">
              <QuotationPrintContent
                ref={printRef}
                quotation={q}
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

/* ============================================================================
   PRINT CONTENT — A4 layout
   ============================================================================ */

const QuotationPrintContent = React.forwardRef<
  HTMLDivElement,
  { quotation: Quotation }
>(function QuotationPrintContent({ quotation: q }, ref) {
  return (
    <div
      ref={ref}
      className="quotation-print bg-white text-black font-sans w-[210mm] min-h-[297mm] p-12"
    >
      {/* HEADER */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/rvdc_logo.png"
            alt="RVDC Logo"
            width={64}
            height={64}
            className="object-contain"
          />
          <div>
            <h1 className="text-lg font-bold leading-tight">
              RVDC Ref & Aircon Repair Shop
            </h1>
            <p className="text-[11px] text-gray-600 leading-snug">
              A-02 MRL Building, Mc. Arthur Hiway,
              <br />
              Mabiga, Mabalacat City, Pampanga, 2010
            </p>
            <p className="text-[11px] text-gray-600">Phone: 0936-667-8269</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            QUOTATION
          </h2>
        </div>
      </div>

      {/* CLIENT & DATE ROW */}
      <div className="grid grid-cols-2 gap-6 mb-6 text-[12px]">
        <div className="space-y-1">
          <div>
            <span className="font-semibold">Client: </span>
            {q.client_name || "—"}
          </div>
          <div>
            <span className="font-semibold">Address: </span>
            {q.client_address || "—"}
          </div>
          {q.client_contact && (
            <div>
              <span className="font-semibold">Contact: </span>
              {q.client_contact}
            </div>
          )}
        </div>
        <div className="space-y-1 text-right">
          <div>
            <span className="font-semibold">Date: </span>
            {q.quote_date
              ? format(new Date(q.quote_date), "MMMM dd, yyyy")
              : "—"}
          </div>
          <div>
            <span className="font-semibold">Valid Until: </span>
            {q.valid_until
              ? format(new Date(q.valid_until), "MMMM dd, yyyy")
              : "—"}
          </div>
        </div>
      </div>

      {/* PROJECT DESCRIPTION */}
      {q.project_description && (
        <div className="mb-5 text-[12px]">
          <h3 className="font-semibold mb-1">Project Description</h3>
          <p className="whitespace-pre-line text-gray-700">
            {q.project_description}
          </p>
        </div>
      )}

      {/* ITEMS TABLE */}
      <table className="w-full text-[12px] border-collapse table-fixed border border-gray-300">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="text-left py-2 px-3 font-semibold w-[50%] border-r border-gray-600">
              Description
            </th>
            <th className="text-center py-2 px-3 font-semibold w-[10%] border-r border-gray-600">
              Qty
            </th>
            <th className="text-right py-2 px-3 font-semibold w-[20%] border-r border-gray-600">
              Unit Price
            </th>
            <th className="text-right py-2 px-3 font-semibold w-[20%]">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {(q.items ?? []).map((item, idx) => (
            <tr
              key={item.id ?? idx}
              className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
            >
              <td className="py-2 px-3 border-b border-r border-gray-300 wrap-break-word whitespace-pre-line">
                {renderFormattedText(item.description)}
              </td>
              <td className="py-2 px-3 text-center border-b border-r border-gray-300">
                {item.quantity}
              </td>
              <td className="py-2 px-3 text-right border-b border-r border-gray-300">
                {formatCurrency(Number(item.unit_price))}
              </td>
              <td className="py-2 px-3 text-right border-b border-gray-300">
                {formatCurrency(item.quantity * Number(item.unit_price))}
              </td>
            </tr>
          ))}
          {(q.items ?? []).length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="py-4 text-center text-gray-400 italic border-b border-gray-300"
              >
                No items
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* NOTES */}
      {q.notes && (
        <div className="text-[11px] text-gray-600 italic py-2 px-3 bg-gray-50 border border-t-0 border-gray-300 whitespace-pre-line">
          Note/s: {q.notes}
        </div>
      )}

      {/* TOTALS — outside table to prevent duplication on page breaks */}
      <div className="quotation-totals border-x border-b border-gray-300">
        <div className="grid grid-cols-[60%_20%_20%] py-2 px-3 border-b border-gray-300 text-[12px] text-gray-600 ">
          <span></span>
          <span className="text-right">Subtotal</span>
          <span className="text-right">
            {formatCurrency(Number(q.subtotal))}
          </span>
        </div>
        {Number(q.discount_amount) > 0 && (
          <div className="grid grid-cols-[60%_20%_20%] py-2 px-3 border-b border-gray-300 text-[12px] text-red-600 bg-white">
            <span></span>
            <span className="text-right">Discount</span>
            <span className="text-right">
              -{formatCurrency(Number(q.discount_amount))}
            </span>
          </div>
        )}
        <div className="grid grid-cols-[60%_20%_20%] py-2 px-3 bg-gray-800 text-white font-bold text-sm">
          <span></span>
          <span className="text-right">Total</span>
          <span className="text-right">
            {formatCurrency(Number(q.total))}
          </span>
        </div>
      </div>

      {/* PAYMENT SCHEDULE */}
      {q.payments && q.payments.length > 0 && (
        <div className="my-4 text-[11px]">
          <h3 className="font-semibold text-[12px] mb-2">Payment Schedule</h3>
          <table className="w-full border-collapse border border-gray-300 text-[11px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left py-1.5 px-3 border border-gray-300 font-semibold w-[20%]">
                  Description
                </th>
                <th className="text-left py-1.5 px-3 border border-gray-300 font-semibold w-[12%]">
                  M.O.P
                </th>
                <th className="text-right py-1.5 px-3 border border-gray-300 font-semibold w-[14%]">
                  Amount
                </th>
                <th className="text-center py-1.5 px-3 border border-gray-300 font-semibold w-[14%]">
                  Ref #
                </th>
                <th className="text-center py-1.5 px-3 border border-gray-300 font-semibold w-[13%]">
                  S.I #
                </th>
                <th className="text-center py-1.5 px-3 border border-gray-300 font-semibold w-[11%]">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {q.payments.map((p, idx) => (
                <tr key={p.id ?? idx}>
                  <td className="py-1.5 px-3 border border-gray-300">
                    {p.label}
                  </td>
                  <td className="py-1.5 px-3 border border-gray-300">
                    {p.payment_method === "bank_transfer"
                      ? "Bank Transfer"
                      : p.payment_method === "gcash"
                        ? "GCash"
                        : p.payment_method === "cash"
                          ? "Cash"
                          : "—"}
                  </td>

                  <td className="py-1.5 px-3 text-right border border-gray-300">
                    {formatCurrency(Number(p.amount))}
                  </td>
                  <td className="py-1.5 px-3 text-center border border-gray-300">
                    {p.reference_number || "—"}
                  </td>
                  <td className="py-1.5 px-3 text-center border border-gray-300">
                    {p.si_number || "—"}
                  </td>
                  <td className="py-1.5 px-3 text-center border border-gray-300">
                    {p.payment_date
                      ? format(new Date(p.payment_date), "MM/dd/yyyy")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TERMS & CONDITIONS */}
      {q.terms_conditions && (
        <div className="my-4 text-[11px]">
          <h3 className="font-semibold text-[12px] mb-1">Terms & Conditions</h3>
          <ul className="list-disc pl-5 text-gray-600 leading-relaxed space-y-0.5">
            {q.terms_conditions
              .split("\n")
              .filter((l) => l.trim())
              .map((line, i) => (
                <li key={i}>{line.trim()}</li>
              ))}
          </ul>
        </div>
      )}

      {/* PAYMENT TERMS */}
      {q.payment_terms && (
        <div className="mb-4 text-[11px]">
          <h3 className="font-semibold text-[12px] mb-1">Payment Terms</h3>
          <ul className="list-disc pl-5 text-gray-600 leading-relaxed space-y-0.5">
            {q.payment_terms
              .split("\n")
              .filter((l) => l.trim())
              .map((line, i) => (
                <li key={i}>{line.trim()}</li>
              ))}
          </ul>
        </div>
      )}

      {/* APPROVAL NOTE & SIGNATURES - Keep together on same page */}
      <div className="signature-section">
        {/* APPROVAL NOTE */}
        <div className="text-[11px] text-gray-600 mb-4 leading-relaxed text-center">
          <p>
            This quotation has been approved by RVDC Ref & Aircon Repair Shop as
            evidenced by the signature of its authorized representative below.
          </p>
          <p className="mt-2">
            If you have any questions concerning this quotation, please contact
            RVDC Ref & Aircon Repair Shop at{" "}
            <span className="font-semibold">0936-667-8269</span>.
          </p>
          <p className="mt-2 italic">
            Thank you for giving us the opportunity to quote and we look forward
            to working with you.
          </p>
        </div>

        {/* SIGNATURES */}
        <div className="grid grid-cols-2 gap-12 mt-6 text-[12px] text-center">
          <div className="flex flex-col relative">
            <p className="font-semibold mb-2">Authorized Representative:</p>
            {q.authorized_signature ? (
              <div className="mb-14">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={q.authorized_signature}
                  alt="Authorized signature"
                  className="h-18 object-contain absolute top-6 left-1/2 transform -translate-x-1/2"
                />
              </div>
            ) : (
              <div className="mb-14" />
            )}
            <div>
              <div className="border-b border-gray-800 mb-1" />
              {q.authorized_name ? (
                <p className="text-[11px] font-semibold uppercase">
                  {q.authorized_name}
                </p>
              ) : (
                <p className="text-[11px] text-gray-500">
                  Signature over Printed Name
                </p>
              )}
              {q.authorized_name && q.authorized_date && (
                <p className="text-[11px] text-gray-500">
                  {format(new Date(q.authorized_date), "MMMM dd, yyyy")}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col relative">
            <p className="font-semibold mb-2">Client Acceptance:</p>
            {q.client_signature ? (
              <div className="mb-14">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={q.client_signature}
                  alt="Client signature"
                  className="h-18 object-contain absolute  top-6 left-1/2 transform -translate-x-1/2"
                />
              </div>
            ) : (
              <div className="mb-14" />
            )}
            <div>
              <div className="border-b border-gray-800 mb-1" />
              {q.client_acceptance_name ? (
                <p className="text-[11px] font-semibold uppercase">
                  {q.client_acceptance_name}
                </p>
              ) : (
                <p className="text-[11px] text-gray-500">
                  Signature over Printed Name
                </p>
              )}
              {q.client_acceptance_name && q.client_acceptance_date && (
                <p className="text-[11px] text-gray-500">
                  {format(new Date(q.client_acceptance_date), "MMMM dd, yyyy")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
