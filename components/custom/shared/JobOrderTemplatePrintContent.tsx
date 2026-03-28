import { Facebook, Mail, Phone } from "lucide-react"
import React from "react"

interface JobOrderTemplatePrintContentProps {
  jobOrderNumbers: number[]
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
        <span className="text-[9pt] font-bold whitespace-nowrap shrink-0 uppercase tracking-wide text-gray-700">
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
      <span className="text-[6pt] font-extrabold uppercase tracking-[0.12em] text-gray-500 whitespace-nowrap">
        {children}
      </span>
      <span className="flex-1 h-px bg-gray-300" />
    </div>
  )
}

function JobOrderSlip({ jobOrderNumber }: { jobOrderNumber: number }) {
  return (
    <div className="flex flex-col h-[8in] text-gray-900 font-sans text-[9.5pt] leading-snug">
      {/* ═══ Header ═══ */}
      <div className="flex items-start justify-between pb-2.5 mb-3 border-b-2 border-gray-800">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/rvdc_logo.png"
            alt="RVDC"
            className="w-16 h-16 object-contain"
          />
          <div>
            <p className="text-[11pt] font-black leading-tight tracking-tight">
              RVDC REF &amp; AIRCON
            </p>
            <p className="text-[11pt] font-black leading-tight tracking-tight">
              REPAIR SHOP
            </p>
            <p className="text-[7pt] text-gray-500 leading-snug mt-0.5 flex items-center gap-0.5">
              <Phone className="w-[8px] h-[8px] inline-block" />
              0936-667-8269 &middot; 0975-214-1349 &middot; 0942-598-3621
            </p>
            <p className="text-[7pt] text-gray-500 leading-snug flex items-center gap-0.5">
              <Mail className="w-[8px] h-[8px] inline-block" />
              rvdcrefandaircon@gmail.com &middot; rvdc12@yahoo.com
            </p>
            <p className="text-[7pt] text-gray-500 leading-snug flex items-center gap-0.5">
              <Facebook className="w-[8px] h-[8px] inline-block" />
              facebook.com/ServicesRVDC
            </p>
          </div>
        </div>
        <div className="shrink-0 bg-gray-800 text-white rounded-lg px-3 py-1.5 text-center">
          <p className="text-[6pt] font-bold uppercase tracking-[0.15em] opacity-70">
            Job Order
          </p>
          <p className="text-[13pt] font-black leading-none tracking-wide">
            #{formatJobOrderNumber(jobOrderNumber)}
          </p>
        </div>
      </div>

      {/* ═══ Date ═══ */}
      <Field label="Date Received:" />

      {/* ═══ Customer ═══ */}
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2">
        <SectionTitle>Customer Information</SectionTitle>
        <Field label="Name:" className="col-span-2" />
        <Field label="Address:" className="col-span-2" />
        <Field className="col-span-2" />
        <Field label="Contact Number:" className="col-span-2" />
        <div />
      </div>

      {/* ═══ Unit ═══ */}
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2">
        <SectionTitle>Unit Details</SectionTitle>
        <Field label="Unit:" />
        <Field label="Brand:" />
        <Field label="Remarks / Problem:" className="col-span-2" />
        <Field className="col-span-2" />
      </div>

      {/* ═══ Service ═══ */}
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 content-start">
        <SectionTitle>Service Details</SectionTitle>
        <Field label="Technician/s:" className="col-span-2" />
        <Field label="Vehicle:" className="col-span-2" />
        <Field label="Scope of Work:" className="col-span-2" />
        <Field className="col-span-2" />
        <Field className="col-span-2" />
      </div>

      {/* ═══ Bottom ═══ */}
      <div className="pt-2.5 mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
        <Field label="Date Claimed/Delivered:"  />
        <Field label="Amount:" />

        <Field label="Cellphone #:" className="col-span-2"/>

      </div>
 <div className="pt-2.5 mt-2 flex gap-x-3 gap-y-2">
 <div className="grid">
          {["Pull-Out & Return", "Home Service"].map((text) => (
            <label
              key={text}
              className="inline-flex items-center gap-1 text-[10pt] font-bold text-gray-700"
            >
              <span className="inline-block w-4 h-4 border-[1.5px] border-gray-600 rounded-sm" />
              {text}
            </label>
          ))}
        </div>
          <div className="flex-1 flex flex-col">
            <span className="flex-1 border-b border-gray-400 min-h-8" />
            <span className="text-[7.5pt] text-gray-500 text-center mt-0.5">Printed Name and Signature</span>
          </div>

      </div>
    {/* ═══ Note Box ═══ */}
      <div className="mt-4 bg-gray-50 border border-gray-300 rounded px-2 py-1.5">
        <p className="text-[7pt] text-gray-800 leading-snug">
          <span className="font-bold">SERVICE FEE:</span> Check-up, transport
          &amp; diagnosis &mdash;{" "}
          <span className="font-extrabold text-red-700">
            ₱500 &ndash; ₱1,000
          </span>{" "}
          (depending on location). This fee will be deducted from the total
          service cost if you proceed with the repair.
        </p>
        <p className="text-[6.5pt] text-gray-700 leading-snug mt-1 font-semibold">
          Units not claimed/delivered within 7 days after completion &mdash; the
          company is not liable for any damage.
        </p>
      </div>
    </div>
  )
}

export const JobOrderTemplatePrintContent = React.forwardRef<
  HTMLDivElement,
  JobOrderTemplatePrintContentProps
>(function JobOrderTemplatePrintContent({ jobOrderNumbers }, ref) {
  const pages = chunkPairs(jobOrderNumbers)

  return (
    <div ref={ref} className="job-order-print bg-white text-black font-sans">
      {pages.map((page, pageIndex) => (
        <div
          key={pageIndex}
          className="jo-page w-[10.5in] h-[8in] grid grid-cols-2 gap-x-5"
        >
          {page.map((num) => (
            <JobOrderSlip key={num} jobOrderNumber={num} />
          ))}
          {page.length === 1 && <div />}
        </div>
      ))}
    </div>
  )
})
