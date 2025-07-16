'use client'

import { SalesTransaction, Stall } from '@/lib/constants/interface'
import useGetReceiptDetails from '@/lib/hooks/useGetReceiptDetails'
import { formatCurrency, formatDate } from '@/lib/utils/helpers'
import React from 'react'

export const SalesTransactionPrintContent = React.forwardRef<
  HTMLDivElement,
  { entity: SalesTransaction | null; stall?: Stall | null }
>(({ entity, stall }, ref) => {
  const createdAt = new Date(entity?.created_at ?? Date.now())
  const paymentsTotal =
    entity?.payments?.reduce((acc, p) => acc + Number(p.amount), 0) ?? 0

  const { shop_name, address, tin_id } = useGetReceiptDetails(stall?.name ?? '')

  return (
    <div
      ref={ref}
      className="w-full max-w-[90%] font-roboto my-6"
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

      <div
        style={{ marginTop: '4px' }}
        className="whitespace-pre"
      >
        --------------------------------------
      </div>

      {/* DETAILS */}
      <div className="text-sm">
        <span className="font-semibold">Date: </span>
        {formatDate(createdAt, 'MM-dd-yyyy, hh:mm a')}
      </div>
      <div className="text-sm">
        <span className="font-semibold">Client: </span>
        {entity?.client?.full_name ?? 'N/A'}
      </div>

      <div
        style={{ marginTop: '4px' }}
        className="whitespace-pre"
      >
        --------------------------------------
      </div>

      <div className="text-center text-md font-semibold mb-3">
        SALES INVOICE
      </div>

      <div className="text-sm">
        <div className="flex font-bold space-x-1.5">
          <div className="w-6">Qty</div>
          <div className="flex-1">Item</div>
          <div className="w-20 text-right">Price</div>
          <div className="w-20 text-right">Total</div>
        </div>

        {entity?.items.map((item, idx) => (
          <div
            key={idx}
            className="flex space-x-1.5"
          >
            <div className="w-6">{item.quantity}</div>
            <div className="flex-1">{item.item?.name ?? 'Unnamed'}</div>
            <div className="w-20 text-right">
              {formatCurrency(item.item?.retail_price ?? 0)}
            </div>
            <div className="w-20 text-right">
              {formatCurrency(item.line_total)}
            </div>
          </div>
        ))}

        <div
          style={{ marginTop: '4px' }}
          className="whitespace-pre"
        >
          --------------------------------------
        </div>

        <div className="flex justify-between">
          <div className="font-bold">Gross:</div>
          <div className="text-right">
            {formatCurrency(Number(entity?.computed_total))}
          </div>
        </div>

        {entity?.payments?.map((payment, key) => (
          <div
            className="flex justify-between"
            key={key}
          >
            <div className=" font-bold">
              {payment.payment_type.toUpperCase()}:
            </div>
            <div className="text-right">
              {formatCurrency(Number(payment.amount))}
            </div>
          </div>
        ))}

        <div className="flex justify-between mt-1">
          <div className=" font-bold">Total Payment:</div>
          <div className="text-right">{formatCurrency(paymentsTotal)}</div>
        </div>

        <div className="flex justify-between">
          <div className="font-bold">Change:</div>
          <div className="text-right">
            {formatCurrency(paymentsTotal - Number(entity?.computed_total))}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center grid place-items-center gap-3 text-sm">
        <div>----- THANK YOU! -----</div>
        <div>THIS SERVES AS YOUR UNOFFICIAL RECEIPT</div>
      </div>

      <div style={{ marginBottom: '3rem' }}>&nbsp;</div>
    </div>
  )
})

SalesTransactionPrintContent.displayName = 'SalesTransactionPrintContent'
