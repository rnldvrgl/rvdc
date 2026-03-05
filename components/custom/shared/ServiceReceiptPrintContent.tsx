"use client"

import {
  AirconUnits,
  Service,
  ServiceAppliance,
} from "@/lib/constants/interface"
import useGetReceiptDetails from "@/lib/hooks/useGetReceiptDetails"
import { formatCurrency } from "@/lib/utils/helpers"
import { formatDate } from "@/lib/utils/helpers/date"
import React from "react"

// ─── Primitives ──────────────────────────────────────────────
type PrintRowProps = {
  label: string
  value: string
  bold?: boolean
}

const PrintRow = ({ label, value, bold }: PrintRowProps) => (
  <div className="flex justify-between text-sm">
    <div className={bold ? "font-bold" : ""}>{label}</div>
    <div className="text-right">{value}</div>
  </div>
)

const Divider = () => (
  <div className="whitespace-pre my-1">
    --------------------------------------
  </div>
)

const SectionTitle = ({ title }: { title: string }) => (
  <div className="text-center text-md font-semibold mb-1">{title}</div>
)

// ─── Receipt header ──────────────────────────────────────────
const ReceiptHeader = ({
  shopName,
  tinId,
  address,
  phone,
}: {
  shopName: string
  tinId: string
  address: string
  phone?: string
}) => (
  <div className="text-center text-sm">
    <div className="font-bold text-xl">{shopName}</div>
    <div className="grid">
      <span className="font-semibold">NON-VAT Reg TIN #:</span>
      {tinId}
    </div>
    <div>{address}</div>
    {phone && (
      <div>
        <span className="font-semibold">Phone:</span> {phone}
      </div>
    )}
  </div>
)

// ─── Items table shared component ────────────────────────────
const ItemsTable = ({
  items,
}: {
  items: {
    qty: number
    description: string
    unitPrice: number
    total: number
  }[]
}) => (
  <>
    <div className="text-sm font-bold flex space-x-1.5">
      <div className="w-6">Qty</div>
      <div className="flex-1">Description</div>
      <div className="w-20 text-right">Price</div>
      <div className="w-20 text-right">Total</div>
    </div>
    {items.map((item, idx) => (
      <div
        key={idx}
        className="flex text-sm space-x-1.5"
      >
        <div className="w-6">{item.qty}</div>
        <div className="flex-1">{item.description}</div>
        <div className="w-20 text-right">{formatCurrency(item.unitPrice)}</div>
        <div className="w-20 text-right">{formatCurrency(item.total)}</div>
      </div>
    ))}
  </>
)

// ─── Helper: extract line items from service ─────────────────
function getLaborItems(appliances: ServiceAppliance[]) {
  return appliances
    .filter(
      (a) =>
        !a.labor_is_free &&
        parseFloat(a.discounted_labor_fee ?? a.labor_fee ?? "0") > 0,
    )
    .map((a) => {
      const fee = parseFloat(a.discounted_labor_fee ?? a.labor_fee ?? "0")
      const typeName = a.appliance_type?.name ?? "Service"
      return {
        qty: 1,
        description: `Labor: ${typeName}${a.brand ? ` (${a.brand})` : ""}`,
        unitPrice: fee,
        total: fee,
      }
    })
}

function getAirconUnitItems(units: AirconUnits[]) {
  return units
    .filter(
      (u) =>
        u.model &&
        parseFloat(String(u.sale_price ?? u.model?.selling_price ?? "0")) > 0,
    )
    .map((u) => {
      const price = parseFloat(
        String(u.sale_price ?? u.model?.selling_price ?? "0"),
      )
      const brand = u.model?.brand?.name ?? ""
      const model = u.model?.name ?? ""
      return {
        qty: 1,
        description: `Aircon Unit: ${brand} ${model} (SN: ${u.serial_number})`,
        unitPrice: price,
        total: price,
      }
    })
}

function getPartsItems(appliances: ServiceAppliance[]) {
  const items: {
    qty: number
    description: string
    unitPrice: number
    total: number
  }[] = []
  for (const a of appliances) {
    for (const part of a.items_used ?? []) {
      if (part.is_free || part.is_cancelled) continue
      const chargedQty =
        part.charged_quantity ?? part.quantity - (part.free_quantity ?? 0)
      if (chargedQty <= 0) continue
      const unitPrice = parseFloat(
        part.discounted_price ?? part.item_price ?? "0",
      )
      items.push({
        qty: chargedQty,
        description: part.item_name ?? `Part #${part.item}`,
        unitPrice,
        total: parseFloat(part.line_total ?? "0"),
      })
    }
  }
  return items
}

// ─── Type for receipt mode ───────────────────────────────────
export type ServiceReceiptMode = "combined" | "main_only" | "sub_only"

// ─── Single Receipt (Main Stall - Labor + Units) ─────────────
const MainStallReceipt = React.forwardRef<
  HTMLDivElement,
  { service: Service; createdAt: Date }
>(({ service, createdAt }, ref) => {
  const { shop_name, tin_id, address } = useGetReceiptDetails("Main Stall")
  const laborItems = getLaborItems(service.appliances ?? [])
  const unitItems =
    service.service_type === "installation"
      ? getAirconUnitItems(service.installation_units ?? [])
      : []
  const allItems = [...laborItems, ...unitItems]

  // Main stall revenue (labor + units) with any applied unit_price for second-hand
  const mainAppliances = service.appliances ?? []
  const extraUnitPriceItems = mainAppliances
    .filter((a) => a.unit_price && parseFloat(a.unit_price) > 0)
    .map((a) => ({
      qty: 1,
      description: `Unit: ${a.appliance_type?.name ?? "Unit"} (${a.brand ?? ""} ${a.model ?? ""})`,
      unitPrice: parseFloat(a.unit_price!),
      total: parseFloat(a.unit_price!),
    }))

  const items = [...allItems, ...extraUnitPriceItems]
  const gross = items.reduce((sum, i) => sum + i.total, 0)

  // Apply service-level discount proportional to main stall share
  const totalRevenue = parseFloat(service.total_revenue || "0")
  const mainRevenue = parseFloat(service.main_stall_revenue || "0")
  const serviceDiscount =
    parseFloat(service.service_discount_amount || "0") ||
    (parseFloat(service.service_discount_percentage || "0") / 100) *
      totalRevenue

  // Prorate discount to main only if there's sub revenue too
  const subRevenue = parseFloat(service.sub_stall_revenue || "0")
  const mainShare =
    totalRevenue > 0 ? mainRevenue / (mainRevenue + subRevenue) : 1
  const mainDiscount = serviceDiscount * mainShare
  const netTotal = Math.max(gross - mainDiscount, 0)

  // Payments attributed (display total paid from service)
  const totalPaid = parseFloat(service.total_paid || "0")

  if (items.length === 0) return <div ref={ref} />

  return (
    <div
      ref={ref}
      className="w-full max-w-[90%] font-roboto"
    >
      <ReceiptHeader
        shopName={shop_name}
        tinId={tin_id}
        address={address}
        phone="0936-667-8269"
      />
      <Divider />
      <PrintRow
        label="Date:"
        value={formatDate(createdAt, "MM-dd-yyyy, hh:mm a")}
        bold
      />
      <PrintRow
        label="Client:"
        value={service.client?.full_name ?? "N/A"}
        bold
      />
      <PrintRow
        label="Service #:"
        value={`SVC-${service.id}`}
        bold
      />
      <PrintRow
        label="Type:"
        value={`${service.service_type?.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())} (${service.service_mode?.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())})`}
        bold
      />
      <Divider />
      <SectionTitle title="SERVICE INVOICE - LABOR" />
      <ItemsTable items={items} />
      <Divider />
      <PrintRow
        label="Subtotal:"
        value={formatCurrency(gross)}
        bold
      />
      {mainDiscount > 0 && (
        <PrintRow
          label="Discount:"
          value={`-${formatCurrency(mainDiscount)}`}
          bold
        />
      )}
      <PrintRow
        label="Total:"
        value={formatCurrency(netTotal)}
        bold
      />
      <Divider />
      <PrintRow
        label="Amount Paid:"
        value={formatCurrency(totalPaid)}
        bold
      />
      <PrintRow
        label="Balance Due:"
        value={formatCurrency(Math.max(netTotal - totalPaid, 0))}
        bold
      />
      <div className="mt-6 text-center grid place-items-center gap-2 text-sm">
        <div>----- THANK YOU! -----</div>
        <div>THIS SERVES AS YOUR UNOFFICIAL RECEIPT</div>
      </div>
    </div>
  )
})
MainStallReceipt.displayName = "MainStallReceipt"

// ─── Single Receipt (Sub Stall - Parts) ──────────────────────
const SubStallReceipt = React.forwardRef<
  HTMLDivElement,
  { service: Service; createdAt: Date }
>(({ service, createdAt }, ref) => {
  const { shop_name, tin_id, address } = useGetReceiptDetails("Sub Stall")
  const partsItems = getPartsItems(service.appliances ?? [])
  const gross = partsItems.reduce((sum, i) => sum + i.total, 0)

  // Apply service-level discount proportional to sub stall share
  const totalRevenue = parseFloat(service.total_revenue || "0")
  const mainRevenue = parseFloat(service.main_stall_revenue || "0")
  const subRevenue = parseFloat(service.sub_stall_revenue || "0")
  const serviceDiscount =
    parseFloat(service.service_discount_amount || "0") ||
    (parseFloat(service.service_discount_percentage || "0") / 100) *
      totalRevenue
  const subShare =
    totalRevenue > 0 ? subRevenue / (mainRevenue + subRevenue) : 0
  const subDiscount = serviceDiscount * subShare
  const netTotal = Math.max(gross - subDiscount, 0)

  if (partsItems.length === 0) return <div ref={ref} />

  return (
    <div
      ref={ref}
      className="w-full max-w-[90%] font-roboto"
    >
      <ReceiptHeader
        shopName={shop_name}
        tinId={tin_id}
        address={address}
        phone="0936-667-8269"
      />
      <Divider />
      <PrintRow
        label="Date:"
        value={formatDate(createdAt, "MM-dd-yyyy, hh:mm a")}
        bold
      />
      <PrintRow
        label="Client:"
        value={service.client?.full_name ?? "N/A"}
        bold
      />
      <PrintRow
        label="Service #:"
        value={`SVC-${service.id}`}
        bold
      />
      <Divider />
      <SectionTitle title="SERVICE INVOICE - PARTS" />
      <ItemsTable items={partsItems} />
      <Divider />
      <PrintRow
        label="Subtotal:"
        value={formatCurrency(gross)}
        bold
      />
      {subDiscount > 0 && (
        <PrintRow
          label="Discount:"
          value={`-${formatCurrency(subDiscount)}`}
          bold
        />
      )}
      <PrintRow
        label="Total:"
        value={formatCurrency(netTotal)}
        bold
      />
      <div className="mt-6 text-center grid place-items-center gap-2 text-sm">
        <div>----- THANK YOU! -----</div>
        <div>THIS SERVES AS YOUR UNOFFICIAL RECEIPT</div>
      </div>
    </div>
  )
})
SubStallReceipt.displayName = "SubStallReceipt"

// ─── Combined Receipt (Both stalls on one page) ─────────────
const CombinedReceipt = React.forwardRef<
  HTMLDivElement,
  { service: Service; createdAt: Date }
>(({ service, createdAt }, ref) => {
  const mainDetails = useGetReceiptDetails("Main Stall")
  const laborItems = getLaborItems(service.appliances ?? [])
  const unitItems =
    service.service_type === "installation"
      ? getAirconUnitItems(service.installation_units ?? [])
      : []
  const mainAppliances = service.appliances ?? []
  const extraUnitPriceItems = mainAppliances
    .filter((a) => a.unit_price && parseFloat(a.unit_price) > 0)
    .map((a) => ({
      qty: 1,
      description: `Unit: ${a.appliance_type?.name ?? "Unit"} (${a.brand ?? ""} ${a.model ?? ""})`,
      unitPrice: parseFloat(a.unit_price!),
      total: parseFloat(a.unit_price!),
    }))
  const mainItems = [...laborItems, ...unitItems, ...extraUnitPriceItems]
  const partsItems = getPartsItems(service.appliances ?? [])

  const mainGross = mainItems.reduce((sum, i) => sum + i.total, 0)
  const partsGross = partsItems.reduce((sum, i) => sum + i.total, 0)
  const grandGross = mainGross + partsGross

  // Service-level discount
  const totalRevenue = parseFloat(service.total_revenue || "0")
  const serviceDiscount =
    parseFloat(service.service_discount_amount || "0") ||
    (parseFloat(service.service_discount_percentage || "0") / 100) *
      totalRevenue

  const grandTotal = Math.max(grandGross - serviceDiscount, 0)
  const totalPaid = parseFloat(service.total_paid || "0")
  const totalRefunded = parseFloat(service.total_refunded || "0")
  const balanceDue = Math.max(grandTotal - totalPaid + totalRefunded, 0)

  // Payment info
  const payments = service.payments ?? []

  return (
    <div
      ref={ref}
      className="w-full max-w-[90%] font-roboto"
    >
      <ReceiptHeader
        shopName={mainDetails.shop_name}
        tinId={mainDetails.tin_id}
        address={mainDetails.address}
        phone="0936-667-8269"
      />
      <Divider />
      <PrintRow
        label="Date:"
        value={formatDate(createdAt, "MM-dd-yyyy, hh:mm a")}
        bold
      />
      <PrintRow
        label="Client:"
        value={service.client?.full_name ?? "N/A"}
        bold
      />
      <PrintRow
        label="Service #:"
        value={`SVC-${service.id}`}
        bold
      />
      <PrintRow
        label="Type:"
        value={`${service.service_type?.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())} - ${service.service_mode?.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}`}
        bold
      />
      <Divider />

      {/* LABOR & UNITS section */}
      {mainItems.length > 0 && (
        <>
          <SectionTitle title="LABOR & SERVICES" />
          <ItemsTable items={mainItems} />
          <div className="text-sm font-bold flex justify-between mt-1">
            <span>Subtotal (Labor):</span>
            <span>{formatCurrency(mainGross)}</span>
          </div>
          <Divider />
        </>
      )}

      {/* PARTS section */}
      {partsItems.length > 0 && (
        <>
          <SectionTitle title="PARTS & ACCESSORIES" />
          <ItemsTable items={partsItems} />
          <div className="text-sm font-bold flex justify-between mt-1">
            <span>Subtotal (Parts):</span>
            <span>{formatCurrency(partsGross)}</span>
          </div>
          <Divider />
        </>
      )}

      {/* TOTALS */}
      <PrintRow
        label="Gross Total:"
        value={formatCurrency(grandGross)}
        bold
      />
      {serviceDiscount > 0 && (
        <>
          <PrintRow
            label="Service Discount:"
            value={`-${formatCurrency(serviceDiscount)}`}
            bold
          />
          {service.discount_reason && (
            <div className="text-xs text-center italic">
              ({service.discount_reason})
            </div>
          )}
        </>
      )}
      <PrintRow
        label="Net Total:"
        value={formatCurrency(grandTotal)}
        bold
      />

      <Divider />

      {/* PAYMENTS */}
      {payments.length > 0 ? (
        <>
          {payments.map((p, idx) => (
            <PrintRow
              key={idx}
              label={`${p.payment_type.toUpperCase()}:`}
              value={formatCurrency(Number(p.amount))}
              bold
            />
          ))}
        </>
      ) : (
        <PrintRow
          label="Payments:"
          value="N/A"
          bold
        />
      )}

      <PrintRow
        label="Total Paid:"
        value={formatCurrency(totalPaid)}
        bold
      />
      {totalRefunded > 0 && (
        <PrintRow
          label="Refunded:"
          value={`-${formatCurrency(totalRefunded)}`}
          bold
        />
      )}
      <PrintRow
        label="Balance Due:"
        value={formatCurrency(balanceDue)}
        bold
      />

      <div className="mt-6 text-center grid place-items-center gap-2 text-sm">
        <div>----- THANK YOU! -----</div>
        <div>THIS SERVES AS YOUR UNOFFICIAL RECEIPT</div>
      </div>
    </div>
  )
})
CombinedReceipt.displayName = "CombinedReceipt"

// ─── Main exported component ─────────────────────────────────
export interface ServiceReceiptPrintContentProps {
  service: Service | null
  mode?: ServiceReceiptMode
}

export const ServiceReceiptPrintContent = React.forwardRef<
  HTMLDivElement,
  ServiceReceiptPrintContentProps
>(({ service, mode = "combined" }, ref) => {
  if (!service) return <div ref={ref} />

  const createdAt = new Date(
    service.updated_at ?? service.created_at ?? Date.now(),
  )

  if (mode === "main_only") {
    return (
      <MainStallReceipt
        ref={ref}
        service={service}
        createdAt={createdAt}
      />
    )
  }

  if (mode === "sub_only") {
    return (
      <SubStallReceipt
        ref={ref}
        service={service}
        createdAt={createdAt}
      />
    )
  }

  // Combined mode (default)
  return (
    <CombinedReceipt
      ref={ref}
      service={service}
      createdAt={createdAt}
    />
  )
})

ServiceReceiptPrintContent.displayName = "ServiceReceiptPrintContent"
