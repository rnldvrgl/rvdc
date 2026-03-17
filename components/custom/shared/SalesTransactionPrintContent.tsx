"use client"

import { SalesTransaction, Stall } from "@/lib/constants/interface"
import useGetReceiptDetails from "@/lib/hooks/useGetReceiptDetails"
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

export const SalesTransactionPrintContent = React.forwardRef<
  HTMLDivElement,
  {
    entity: SalesTransaction | null
    stall: Stall | null
  }
>(({ entity, stall }, ref) => {
  const createdAt = new Date(entity?.created_at ?? Date.now())

  const isFakePrint = !!entity?.items?.some((item) => {
    const finalPrice = Number(
      item.final_price_per_unit ?? item.item?.retail_price ?? 0,
    )
    const printPrice = Number(item.print_price_per_unit ?? finalPrice)
    return printPrice !== finalPrice
  })

  const { shop_name, address, tin_id } = useGetReceiptDetails(stall?.name ?? "")

  const discount = Number(entity?.order_discount || 0)

  const printTotal =
    entity?.items?.reduce((acc, item) => {
      const unitPrice = isFakePrint
        ? Number(item.print_price_per_unit ?? 0)
        : Number(item.final_price_per_unit ?? item.item?.retail_price ?? 0)
      return acc + unitPrice * item.quantity
    }, 0) ?? 0

  const discountedTotal = isFakePrint ? printTotal : printTotal - discount

  const paymentsTotal = isFakePrint
    ? printTotal
    : (entity?.payments?.reduce((acc, p) => acc + Number(p.amount), 0) ?? 0)

  const printChangeDue = paymentsTotal - discountedTotal

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

          {/* ── DATE / CLIENT ── */}
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
              {entity?.client?.full_name ?? "Walk-in"}
            </td>
          </tr>

          <Dash />
          <CenterRow
            bold
            size="13px"
          >
            SALES INVOICE
          </CenterRow>
          <Dash />

          {/* ── ITEMS ── */}
          {entity?.items.map((item, idx) => {
            const unitPrice = isFakePrint
              ? Number(item.print_price_per_unit ?? 0)
              : Number(
                  item.final_price_per_unit ?? item.item?.retail_price ?? 0,
                )
            const lineTotal = unitPrice * item.quantity
            const name = item.item?.name || item.description || "Custom Item"

            return (
              <React.Fragment key={`${item.item?.id ?? "c"}-${idx}`}>
                {/* Item name — full width */}
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
                    {name}
                  </td>
                </tr>
                {/* qty x price    total */}
                <LR
                  left={`${Number(item.quantity).toFixed(2)} x ${peso(unitPrice)}`}
                  right={peso(lineTotal)}
                />
              </React.Fragment>
            )
          })}

          <Dash />

          {/* ── TOTALS ── */}
          <LR
            left="SUBTOTAL"
            right={peso(printTotal)}
            bold
          />

          {!isFakePrint && discount > 0 && (
            <>
              <LR
                left="DISCOUNT"
                right={`-${peso(discount)}`}
              />
              <LR
                left="TOTAL"
                right={peso(discountedTotal)}
                bold
              />
            </>
          )}

          <Dash />

          {/* ── PAYMENTS ── */}
          {isFakePrint ? (
            <LR
              left="CASH"
              right={peso(printTotal)}
            />
          ) : (
            entity?.payments?.map((payment, idx) => (
              <LR
                key={`${payment.payment_type}-${idx}`}
                left={`${payment.payment_type.toUpperCase()}${payment.cheque_number ? ` #${payment.cheque_number}` : ""}`}
                right={peso(Number(payment.amount))}
              />
            ))
          )}

          <LR
            left="TOTAL PAID"
            right={peso(paymentsTotal)}
            bold
          />
          <LR
            left="CHANGE"
            right={peso(printChangeDue)}
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

SalesTransactionPrintContent.displayName = "SalesTransactionPrintContent"
