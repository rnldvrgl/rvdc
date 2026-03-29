import { Facebook, Mail, Phone } from "lucide-react"
import React from "react"

interface JobOrderTemplatePrintContentProps {
  jobOrderNumbers: number[]
  showPreviewMargins?: boolean
}

function formatJobOrderNumber(num: number): string {
  return String(num).padStart(6, "0")
}

function chunkPairs(numbers: number[]): number[][] {
  const pages: number[][] = []
  for (let i = 0; i < numbers.length; i += 2) {
    pages.push(numbers.slice(i, i + 2))
  }
  return pages
}

function Field({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-end gap-1 ${className ?? ""}`}>
      {label && (
        <span className="text-[10pt] font-bold whitespace-nowrap shrink-0 uppercase tracking-wide text-gray-900">
          {label}
        </span>
      )}
      <span className="flex-1 border-b border-gray-400 min-h-5" />
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 col-span-2 mb-1">
      <span className="text-[7pt] font-extrabold uppercase tracking-[0.12em] text-gray-700 whitespace-nowrap">
        {children}
      </span>
    </div>
  )
}

function JobOrderSlip({ jobOrderNumber }: { jobOrderNumber: number }) {
  return (
    <div className="flex flex-col h-full text-black font-sans text-[10.5pt] leading-snug overflow-hidden">
      {/* ═══ Header ═══ */}
      <div className="flex items-start justify-between pb-2 mb-2 border-b-2 border-gray-800">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/rvdc_logo.png"
            alt="RVDC"
            className="w-16 h-16 object-contain"
          />
          <div>
            <p className="text-[12pt] font-black leading-tight tracking-tight">
              RVDC REF &amp; AIRCON REPAIR SHOP
            </p>
            <p className="text-[7.5pt] text-gray-700 leading-snug mt-0.5 flex items-center gap-0.5">
              <Phone className="w-[9px] h-[9px] inline-block" />
              0936-667-8269 &middot; 0975-214-1349 &middot; 0942-598-3621
            </p>
            <p className="text-[7.5pt] text-gray-700 leading-snug flex items-center gap-0.5">
              <Mail className="w-[9px] h-[9px] inline-block" />
              rvdcrefandaircon@gmail.com &middot; rvdc12@yahoo.com
            </p>
            <p className="text-[7.5pt] text-gray-700 leading-snug flex items-center gap-0.5">
              <Facebook className="w-[9px] h-[9px] inline-block" />
              facebook.com/ServicesRVDC
            </p>
          </div>
        </div>
        <div className="shrink-0 bg-gray-800 text-white rounded-lg px-3 py-1.5 text-center">
          <p className="text-[7pt] font-bold uppercase tracking-[0.15em] opacity-70">
            Job Order
          </p>
          <p className="text-[14pt] font-black leading-none tracking-wide">
            #{formatJobOrderNumber(jobOrderNumber)}
          </p>
        </div>
      </div>

      {/* ═══ Date ═══ */}
      <Field label="Date Received:" />

      {/* ═══ Customer ═══ */}
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1">
        <SectionTitle>Customer Information</SectionTitle>
        <Field label="Name:" className="col-span-2" />
        <Field label="Address:" className="col-span-2" />
        <Field className="col-span-2" />
        <Field label="Contact Number:" className="col-span-2" />
      </div>

      {/* ═══ Unit ═══ */}
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1">
        <SectionTitle>Unit Details</SectionTitle>
        <Field label="Unit:" />
        <Field label="Brand:" />
        <Field label="Remarks / Problem:" className="col-span-2" />
        <Field className="col-span-2" />
      </div>

      {/* ═══ Service ═══ */}
      <div className="mt-4 flex-1 grid grid-cols-2 gap-x-3 gap-y-1 content-start">
        <SectionTitle>Service Details</SectionTitle>
        <Field label="Technician/s:" className="col-span-2" />
        <Field label="Cellphone #:" className="col-span-2" />
        <Field label="Vehicle:" className="col-span-2" />
        <Field label="Scope of Work:" className="col-span-2" />
        <Field className="col-span-2" />
        <Field className="col-span-2" />
        <Field className="col-span-2" />
      </div>

              {/* Service Fee */}
        <div className="my-2 flex items-center gap-2">
          <span className="text-[10pt] font-bold uppercase tracking-wide text-gray-900 whitespace-nowrap">
            Service Fee:
          </span>
          {["₱500", "₱800", "₱1,000"].map((fee) => (
            <span
              key={fee}
              className="inline-flex items-center justify-center w-[54px] h-[22px] border-[1.5px] border-gray-600 rounded text-[9pt] font-bold text-gray-900"
            >
              {fee}
            </span>
          ))}
        </div>

      {/* ═══ Bottom ═══ */}
      <div className="mt-auto">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <Field label="Date Claimed/Delivered:" className="col-span-2" />
          <Field label="Amount:" className="col-span-2" />
        </div>



        <div className="mt-1.5 flex gap-x-3">
          <div className="grid">
            {["Pull-Out & Return", "Home Service"].map((text) => (
              <label
                key={text}
                className="inline-flex items-center gap-1 text-[10.5pt] font-bold text-gray-900"
              >
                <span className="inline-block w-4 h-4 border-[1.5px] border-gray-600 rounded-sm" />
                {text}
              </label>
            ))}
          </div>
          <div className="flex-1 flex flex-col">
            <span className="flex-1 border-b border-gray-400 min-h-8" />
            <span className="text-[8pt] text-gray-700 text-center mt-0.5">
              Printed Name and Signature
            </span>
          </div>
        </div>

        {/* ═══ Note Box ═══ */}
        <div className="mt-3 bg-gray-100 border-2 border-gray-500 rounded px-2.5 py-1.5">
          <p className="text-[8pt] text-black leading-snug">
            <span className="font-extrabold text-destructive">SERVICE FEE:</span> Check-up, transport
            &amp; diagnosis (depending on location). This fee will be deducted
            from the total service cost if you proceed with the repair.
          </p>
          <p className="text-[7.5pt] text-gray-900 leading-snug mt-0.5 font-bold">
            Units not claimed/delivered within 7 days after completion &mdash;
            the company is not liable for any damage.
          </p>
        </div>
      </div>
    </div>
  )
}

export const JobOrderTemplatePrintContent = React.forwardRef<
  HTMLDivElement,
  JobOrderTemplatePrintContentProps
>(function JobOrderTemplatePrintContent({ jobOrderNumbers, showPreviewMargins }, ref) {
  const pages = chunkPairs(jobOrderNumbers)

  return (
    <div ref={ref} className="job-order-print bg-white text-black font-sans">
      {pages.map((page, pageIndex) => (
        <div
          key={pageIndex}
          className={`${
            showPreviewMargins
              ? "w-[11in] h-[8.5in] p-[0.25in] bg-white border border-gray-300 rounded shadow-sm mb-4"
              : ""
          }`}
        >
          <div
            className="jo-page w-full h-full grid grid-cols-2 gap-x-[0.5in]"
          >
            {page.map((num) => (
              <JobOrderSlip key={num} jobOrderNumber={num} />
            ))}
            {page.length === 1 && <div />}
          </div>
        </div>
      ))}
    </div>
  )
})
