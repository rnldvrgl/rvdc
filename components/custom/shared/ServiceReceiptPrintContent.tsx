"use client"

import {
  AirconUnits,
  Service,
  ServiceAppliance,
  ServiceItemUsed,
} from "@/lib/constants/interface"
import useGetReceiptDetails from "@/lib/hooks/useGetReceiptDetails"
import { useServiceItems } from "@/lib/queries/services/useServiceItems"
import { formatDate } from "@/lib/utils/helpers/date"
import React from "react"

const FONT = "'Courier New', Courier, monospace"
const DASH = "---------------------------"

const peso = (n: number) =>
  "P" +
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

/* ── tiny helper components ─────────────────────────── */

const CenterRow = ({
  children,
  bold,
  size,
}: {
  children: React.ReactNode
  bold?: boolean
  size?: string
}) => (
  <tr>
    <td
      colSpan={2}
      style={{
        fontFamily: FONT,
        fontSize: size ?? "14px",
        fontWeight: bold ? 1000 : 700,
        textAlign: "center",
        padding: "1px 0",
        wordBreak: "break-word",
      }}
    >
      {children}
    </td>
  </tr>
)

const Dash = () => (
  <tr>
    <td
      colSpan={2}
      style={{
        fontFamily: FONT,
        fontSize: "12px",
        fontWeight: 700,
        textAlign: "center",
        padding: "2px 0",
        whiteSpace: "pre",
      }}
    >
      {DASH}
    </td>
  </tr>
)

/** Left / Right row — used for key-value lines */
const LR = ({
  left,
  right,
  bold,
}: {
  left: string
  right: string
  bold?: boolean
}) => (
  <tr>
    <td
      style={{
        fontFamily: FONT,
        fontSize: "13px",
        fontWeight: bold ? 900 : 700,
        textAlign: "left",
        padding: "1px 0",
        verticalAlign: "top",
      }}
    >
      {left}
    </td>
    <td
      style={{
        fontFamily: FONT,
        fontSize: "14px",
        fontWeight: bold ? 900 : 700,
        textAlign: "right",
        padding: "1px 0",
        verticalAlign: "top",
        whiteSpace: "nowrap",
      }}
    >
      {right}
    </td>
  </tr>
)

// ─── Helper: extract line items from service ─────────────────
function getLaborItems(appliances: ServiceAppliance[]) {
  return appliances
    .filter(
      (a) =>
        !a.labor_is_free &&
        parseFloat(
          a.installation_labor_fee ?? a.discounted_labor_fee ?? a.labor_fee ?? "0",
        ) > 0,
    )
    .map((a) => {
      const fee = parseFloat(
        a.installation_labor_fee ?? a.discounted_labor_fee ?? a.labor_fee ?? "0",
      )
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
        parseFloat(String(u.installation_unit_fee ?? u.sale_price ?? u.model?.selling_price ?? "0")) > 0,
    )
    .map((u) => {
      const price = parseFloat(
        String(u.installation_unit_fee ?? u.sale_price ?? u.model?.selling_price ?? "0"),
      )
      const brand = u.model?.brand?.name ?? ""
      const model = u.model?.name ?? ""
      return {
        qty: 1,
        description: `Installation Fee - Aircon Unit: ${brand} ${model} (SN: ${u.serial_number})`,
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

function getServiceLevelItems(serviceItems: ServiceItemUsed[]) {
  const items: {
    qty: number
    description: string
    unitPrice: number
    total: number
  }[] = []
  for (const si of serviceItems) {
    if (si.is_free || si.is_cancelled) continue
    const chargedQty =
      si.charged_quantity ?? si.quantity - (si.free_quantity ?? 0)
    if (chargedQty <= 0) continue
    const unitPrice = parseFloat(
      si.discounted_price ?? si.item_price ?? si.custom_price ?? "0",
    )
    items.push({
      qty: chargedQty,
      description: si.item_name || si.custom_description || `Part #${si.item}`,
      unitPrice,
      total: parseFloat(si.line_total ?? "0"),
    })
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
      className="thermal-receipt-print"
      style={{
        width: "58mm",
        maxWidth: "58mm",
        margin: "0 auto",
        padding: "2mm 1mm 10mm 1mm",
        background: "#fff",
        color: "#000",
        fontFamily: FONT,
        fontSize: "13px",
        fontWeight: 700,
        lineHeight: "1.3",
        boxSizing: "border-box",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <tbody>
          {/* ── HEADER ── */}
          <CenterRow
            bold
            size="14px"
          >
            {shop_name}
          </CenterRow>
          <CenterRow size="13px">
            NON-VAT Reg TIN: <br />
            {tin_id}
          </CenterRow>
          <CenterRow size="13px">{address}</CenterRow>
          <CenterRow size="13px">Tel: 0936-667-8269</CenterRow>

          <Dash />

          {/* ── DATE / CLIENT / SERVICE INFO ── */}
          <tr>
            <td
              colSpan={2}
              style={{
                fontFamily: FONT,
                fontSize: "12px",
                padding: "2px 0",
                textAlign: "left",
              }}
            >
              {formatDate(createdAt, "MMM/dd/yyyy hh:mm a")}
            </td>
          </tr>
          <tr>
            <td
              colSpan={2}
              style={{
                fontFamily: FONT,
                fontSize: "12px",
                padding: "2px 0",
                textAlign: "left",
                wordBreak: "break-word",
              }}
            >
              {service.client?.full_name ?? "N/A"}
            </td>
          </tr>
          <tr>
            <td
              colSpan={2}
              style={{
                fontFamily: FONT,
                fontSize: "12px",
                padding: "2px 0",
                textAlign: "left",
              }}
            >
              Service #: SVC-{service.id}
            </td>
          </tr>
          <tr>
            <td
              colSpan={2}
              style={{
                fontFamily: FONT,
                fontSize: "12px",
                padding: "2px 0",
                textAlign: "left",
              }}
            >
              Type:{" "}
              {service.service_type
                ?.replace("_", " ")
                .replace(/^\w/, (c) => c.toUpperCase())}{" "}
              (
              {service.service_mode
                ?.replace("_", " ")
                .replace(/^\w/, (c) => c.toUpperCase())}
              )
            </td>
          </tr>

          <Dash />
          <CenterRow
            bold
            size="13px"
          >
            SERVICE INVOICE - LABOR
          </CenterRow>
          <Dash />

          {/* ── ITEMS ── */}
          {items.map((item, idx) => (
            <React.Fragment key={idx}>
              {/* Item description — full width */}
              <tr>
                <td
                  colSpan={2}
                  style={{
                    fontFamily: FONT,
                    fontSize: "14px",
                    padding: "3px 0 1px",
                    wordBreak: "break-word",
                  }}
                >
                  {item.description}
                </td>
              </tr>
              {/* qty x price    total */}
              <LR
                left={`${item.qty.toFixed(2)} x ${peso(item.unitPrice)}`}
                right={peso(item.total)}
              />
            </React.Fragment>
          ))}

          <Dash />

          {/* ── TOTALS ── */}
          <LR
            left="SUBTOTAL"
            right={peso(gross)}
            bold
          />

          {mainDiscount > 0 && (
            <>
              <LR
                left="DISCOUNT"
                right={`-${peso(mainDiscount)}`}
              />
              <LR
                left="TOTAL"
                right={peso(netTotal)}
                bold
              />
            </>
          )}

          <Dash />

          <LR
            left="AMOUNT PAID"
            right={peso(totalPaid)}
            bold
          />
          <LR
            left="BALANCE DUE"
            right={peso(Math.max(netTotal - totalPaid, 0))}
            bold
          />

          <Dash />

          {/* ── FOOTER ── */}
          <CenterRow size="13px">
            <br />
            ---- THANK YOU! ----
            <br />
            This serves as your
            <br />
            unofficial receipt
            <br />
          </CenterRow>
        </tbody>
      </table>
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
  const { data: serviceItems = [] } = useServiceItems(service.id)
  const appliancePartsItems = getPartsItems(service.appliances ?? [])
  const serviceLevelItems = getServiceLevelItems(serviceItems)
  const partsItems = [...appliancePartsItems, ...serviceLevelItems]
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
      className="thermal-receipt-print"
      style={{
        width: "58mm",
        maxWidth: "58mm",
        margin: "0 auto",
        padding: "2mm 1mm 10mm 1mm",
        background: "#fff",
        color: "#000",
        fontFamily: FONT,
        fontSize: "13px",
        fontWeight: 700,
        lineHeight: "1.3",
        boxSizing: "border-box",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <tbody>
          {/* ── HEADER ── */}
          <CenterRow
            bold
            size="14px"
          >
            {shop_name}
          </CenterRow>
          <CenterRow size="13px">
            NON-VAT Reg TIN: <br />
            {tin_id}
          </CenterRow>
          <CenterRow size="13px">{address}</CenterRow>
          <CenterRow size="13px">Tel: 0936-667-8269</CenterRow>

          <Dash />

          {/* ── DATE / CLIENT / SERVICE INFO ── */}
          <tr>
            <td
              colSpan={2}
              style={{
                fontFamily: FONT,
                fontSize: "12px",
                padding: "2px 0",
                textAlign: "left",
              }}
            >
              {formatDate(createdAt, "MMM/dd/yyyy hh:mm a")}
            </td>
          </tr>
          <tr>
            <td
              colSpan={2}
              style={{
                fontFamily: FONT,
                fontSize: "12px",
                padding: "2px 0",
                textAlign: "left",
                wordBreak: "break-word",
              }}
            >
              {service.client?.full_name ?? "N/A"}
            </td>
          </tr>
          <tr>
            <td
              colSpan={2}
              style={{
                fontFamily: FONT,
                fontSize: "12px",
                padding: "2px 0",
                textAlign: "left",
              }}
            >
              Service #: SVC-{service.id}
            </td>
          </tr>

          <Dash />
          <CenterRow
            bold
            size="13px"
          >
            SERVICE INVOICE - PARTS
          </CenterRow>
          <Dash />

          {/* ── ITEMS ── */}
          {partsItems.map((item, idx) => (
            <React.Fragment key={idx}>
              {/* Item description — full width */}
              <tr>
                <td
                  colSpan={2}
                  style={{
                    fontFamily: FONT,
                    fontSize: "14px",
                    padding: "3px 0 1px",
                    wordBreak: "break-word",
                  }}
                >
                  {item.description}
                </td>
              </tr>
              {/* qty x price    total */}
              <LR
                left={`${item.qty.toFixed(2)} x ${peso(item.unitPrice)}`}
                right={peso(item.total)}
              />
            </React.Fragment>
          ))}

          <Dash />

          {/* ── TOTALS ── */}
          <LR
            left="SUBTOTAL"
            right={peso(gross)}
            bold
          />

          {subDiscount > 0 && (
            <>
              <LR
                left="DISCOUNT"
                right={`-${peso(subDiscount)}`}
              />
              <LR
                left="TOTAL"
                right={peso(netTotal)}
                bold
              />
            </>
          )}

          <Dash />

          {/* ── FOOTER ── */}
          <CenterRow size="13px">
            <br />
            ---- THANK YOU! ----
            <br />
            This serves as your
            <br />
            unofficial receipt
            <br />
          </CenterRow>
        </tbody>
      </table>
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
  const { data: serviceItems = [] } = useServiceItems(service.id)
  const appliancePartsItems = getPartsItems(service.appliances ?? [])
  const serviceLevelItems = getServiceLevelItems(serviceItems)
  const partsItems = [...appliancePartsItems, ...serviceLevelItems]

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
      className="thermal-receipt-print"
      style={{
        width: "58mm",
        maxWidth: "58mm",
        margin: "0 auto",
        padding: "2mm 1mm 10mm 1mm",
        background: "#fff",
        color: "#000",
        fontFamily: FONT,
        fontSize: "13px",
        fontWeight: 700,
        lineHeight: "1.3",
        boxSizing: "border-box",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <tbody>
          {/* ── HEADER ── */}
          <CenterRow
            bold
            size="14px"
          >
            {mainDetails.shop_name}
          </CenterRow>
          <CenterRow size="13px">
            NON-VAT Reg TIN: <br />
            {mainDetails.tin_id}
          </CenterRow>
          <CenterRow size="13px">{mainDetails.address}</CenterRow>
          <CenterRow size="13px">Tel: 0936-667-8269</CenterRow>

          <Dash />

          {/* ── DATE / CLIENT / SERVICE INFO ── */}
          <tr>
            <td
              colSpan={2}
              style={{
                fontFamily: FONT,
                fontSize: "12px",
                padding: "2px 0",
                textAlign: "left",
              }}
            >
              {formatDate(createdAt, "MMM/dd/yyyy hh:mm a")}
            </td>
          </tr>
          <tr>
            <td
              colSpan={2}
              style={{
                fontFamily: FONT,
                fontSize: "12px",
                padding: "2px 0",
                textAlign: "left",
                wordBreak: "break-word",
              }}
            >
              {service.client?.full_name ?? "N/A"}
            </td>
          </tr>
          <tr>
            <td
              colSpan={2}
              style={{
                fontFamily: FONT,
                fontSize: "12px",
                padding: "2px 0",
                textAlign: "left",
              }}
            >
              Service #: SVC-{service.id}
            </td>
          </tr>
          <tr>
            <td
              colSpan={2}
              style={{
                fontFamily: FONT,
                fontSize: "12px",
                padding: "2px 0",
                textAlign: "left",
              }}
            >
              Type:{" "}
              {service.service_type
                ?.replace("_", " ")
                .replace(/^\w/, (c) => c.toUpperCase())}{" "}
              -{" "}
              {service.service_mode
                ?.replace("_", " ")
                .replace(/^\w/, (c) => c.toUpperCase())}
            </td>
          </tr>

          <Dash />

          {/* LABOR & UNITS section */}
          {mainItems.length > 0 && (
            <>
              <CenterRow
                bold
                size="13px"
              >
                LABOR & SERVICES
              </CenterRow>
              {mainItems.map((item, idx) => (
                <React.Fragment key={`main-${idx}`}>
                  <tr>
                    <td
                      colSpan={2}
                      style={{
                        fontFamily: FONT,
                        fontSize: "14px",
                        padding: "3px 0 1px",
                        wordBreak: "break-word",
                      }}
                    >
                      {item.description}
                    </td>
                  </tr>
                  <LR
                    left={`${item.qty.toFixed(2)} x ${peso(item.unitPrice)}`}
                    right={peso(item.total)}
                  />
                </React.Fragment>
              ))}
              <LR
                left="Subtotal (Labor):"
                right={peso(mainGross)}
                bold
              />
              <Dash />
            </>
          )}

          {/* PARTS section */}
          {partsItems.length > 0 && (
            <>
              <CenterRow
                bold
                size="13px"
              >
                PARTS & ACCESSORIES
              </CenterRow>
              {partsItems.map((item, idx) => (
                <React.Fragment key={`parts-${idx}`}>
                  <tr>
                    <td
                      colSpan={2}
                      style={{
                        fontFamily: FONT,
                        fontSize: "14px",
                        padding: "3px 0 1px",
                        wordBreak: "break-word",
                      }}
                    >
                      {item.description}
                    </td>
                  </tr>
                  <LR
                    left={`${item.qty.toFixed(2)} x ${peso(item.unitPrice)}`}
                    right={peso(item.total)}
                  />
                </React.Fragment>
              ))}
              <LR
                left="Subtotal (Parts):"
                right={peso(partsGross)}
                bold
              />
              <Dash />
            </>
          )}

          {/* TOTALS */}
          <LR
            left="GROSS TOTAL"
            right={peso(grandGross)}
            bold
          />

          {serviceDiscount > 0 && (
            <>
              <LR
                left="DISCOUNT"
                right={`-${peso(serviceDiscount)}`}
              />
              {service.discount_reason && (
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      fontFamily: FONT,
                      fontSize: "11px",
                      fontStyle: "italic",
                      textAlign: "center",
                      padding: "1px 0",
                    }}
                  >
                    ({service.discount_reason})
                  </td>
                </tr>
              )}
            </>
          )}

          <LR
            left="NET TOTAL"
            right={peso(grandTotal)}
            bold
          />

          <Dash />

          {/* PAYMENTS */}
          {payments.length > 0 ? (
            <>
              {payments.map((p, idx) => (
                <LR
                  key={idx}
                  left={p.payment_type.toUpperCase()}
                  right={peso(Number(p.amount))}
                />
              ))}
            </>
          ) : (
            <LR
              left="PAYMENTS"
              right="N/A"
            />
          )}

          <LR
            left="TOTAL PAID"
            right={peso(totalPaid)}
            bold
          />
          {totalRefunded > 0 && (
            <LR
              left="REFUNDED"
              right={`-${peso(totalRefunded)}`}
            />
          )}
          <LR
            left="BALANCE DUE"
            right={peso(balanceDue)}
            bold
          />

          <Dash />

          {/* ── FOOTER ── */}
          <CenterRow size="13px">
            <br />
            ---- THANK YOU! ----
            <br />
            This serves as your
            <br />
            unofficial receipt
            <br />
          </CenterRow>
        </tbody>
      </table>
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
