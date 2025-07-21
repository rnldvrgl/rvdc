'use client'

import { SalesTransaction, Stall } from '@/lib/constants/interface'
import useGetReceiptDetails from '@/lib/hooks/useGetReceiptDetails'
import { formatCurrency, formatDate } from '@/lib/utils/helpers'
import React from 'react'

type PrintRowProps = {
  label: string
  value: string
  bold?: boolean
  alignRight?: boolean
}

const PrintRow = ({ label, value, bold, alignRight }: PrintRowProps) => (
  <div className="flex justify-between text-sm">
    <div className={bold ? 'font-bold' : ''}>{label}</div>
    <div className={alignRight ? 'text-right' : ''}>{value}</div>
  </div>
)

const Divider = () => (
  <div className="whitespace-pre my-1">
    --------------------------------------
  </div>
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

  const { shop_name, address, tin_id } = useGetReceiptDetails(stall?.name ?? '')

  const printTotal =
    entity?.items?.reduce((acc, item) => {
      const unitPrice = isFakePrint
        ? Number(item.print_price_per_unit ?? 0)
        : Number(item.final_price_per_unit ?? item.item?.retail_price ?? 0)

      return acc + unitPrice * item.quantity
    }, 0) ?? 0

  const paymentsTotal = isFakePrint
    ? printTotal
    : entity?.payments?.reduce((acc, p) => acc + Number(p.amount), 0) ?? 0

  const printChangeDue = paymentsTotal - printTotal

  return (
    <div
      ref={ref}
      className="w-full max-w-[90%] font-roboto"
    >
      {/* HEADER */}
      <div className="text-center text-sm">
        <div className="font-bold text-xl">{shop_name}</div>
        <div className="grid">
          <span className="font-semibold">NON-VAT Reg TIN #:</span>
          {tin_id}
        </div>
        <div>{address}</div>
        <div>
          <span className="font-semibold">Phone:</span> 0936-667-8269
        </div>
      </div>

      <Divider />

      {/* DETAILS */}
      <PrintRow
        label="Date:"
        value={formatDate(createdAt, 'MM-dd-yyyy, hh:mm a')}
        bold
      />
      <PrintRow
        label="Client:"
        value={entity?.client?.full_name ?? 'N/A'}
        bold
      />

      <Divider />

      {/* INVOICE */}
      <div className="text-center text-md font-semibold mb-1">
        SALES INVOICE
      </div>

      <div className="text-sm font-bold flex space-x-1.5">
        <div className="w-6">Qty</div>
        <div className="flex-1">Item</div>
        <div className="w-20 text-right">Price</div>
        <div className="w-20 text-right">Total</div>
      </div>

      {entity?.items.map((item, idx) => {
        const unitPrice = isFakePrint
          ? Number(item.print_price_per_unit ?? 0)
          : Number(item.final_price_per_unit ?? item.item?.retail_price ?? 0)

        const lineTotal = unitPrice * item.quantity

        return (
          <div
            key={`${item.item?.id}-${idx}`}
            className="flex text-sm space-x-1.5"
          >
            <div className="w-6">{item.quantity}</div>
            <div className="flex-1">{item.item?.name ?? 'Unnamed'}</div>
            <div className="w-20 text-right">{formatCurrency(unitPrice)}</div>
            <div className="w-20 text-right">{formatCurrency(lineTotal)}</div>
          </div>
        )
      })}

      <Divider />

      <PrintRow
        label="Gross:"
        value={formatCurrency(printTotal)}
        bold
      />

      {isFakePrint ? (
        <PrintRow
          label="Cash:"
          value={formatCurrency(printTotal)}
          bold
        />
      ) : (
        <>
          {entity?.payments?.map((payment, idx) => (
            <PrintRow
              key={`${payment.payment_type}-${idx}`}
              label={`${payment.payment_type.toUpperCase()}:`}
              value={formatCurrency(Number(payment.amount))}
              bold
            />
          ))}
        </>
      )}

      <PrintRow
        label="Total Payment:"
        value={formatCurrency(paymentsTotal)}
        bold
      />
      <PrintRow
        label="Change:"
        value={formatCurrency(printChangeDue)}
        bold
      />

      <div className="mt-6 text-center grid place-items-center gap-2 text-sm">
        <div>----- THANK YOU! -----</div>
        <div>THIS SERVES AS YOUR UNOFFICIAL RECEIPT</div>
      </div>
    </div>
  )
})

SalesTransactionPrintContent.displayName = 'SalesTransactionPrintContent'
