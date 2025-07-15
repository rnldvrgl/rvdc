'use client'

import { SalesTransaction } from '@/lib/constants/interface'
import { formatCurrency, formatDate } from '@/lib/utils/helpers'
import React from 'react'

export const SalesTransactionPrintContent = React.forwardRef<
  HTMLDivElement,
  { entity: SalesTransaction | null }
>(({ entity }, ref) => {
  const createdAt = new Date(entity?.created_at ?? Date.now())

  const LineBreaker = () => <div>--------------------------------</div>

  return (
    <div
      ref={ref}
      className="w-full text-[11px] font-mono space-y-1"
    >
      {/* HEADER */}
      <div className="text-center font-bold space-y-0.5">
        <div>RVDC REF & AIRCON REPAIR SHOP</div>
        <div>SALES RECEIPT</div>
      </div>

      {/* DETAILS */}
      <div>
        <div>Date: {formatDate(createdAt, 'MM-dd-yyyy, hh:mm a')}</div>
        <div>Client: {entity?.client?.full_name ?? 'N/A'}</div>
        <div>
          Receipt #:{' '}
          {entity?.manual_receipt_number || entity?.system_receipt_number}
        </div>
      </div>

      <LineBreaker />

      {/* ITEMS */}
      <div>
        <div className="font-bold">Items</div>
        {entity?.items.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between"
          >
            <div>
              {item.item?.name ?? 'Unnamed'} x {item.quantity}
            </div>
            <div>{formatCurrency(item.line_total)}</div>
          </div>
        ))}
      </div>

      <LineBreaker />

      {/* TOTAL */}
      <div className="flex justify-between font-bold">
        <span>Total:</span>
        <span>{formatCurrency(Number(entity?.computed_total))}</span>
      </div>

      {/* TODO: ADD PAYMENTS */}
      {/* PAYMENTS */}
      {/* <div>
        <div className="font-bold">Payments</div>
        {entity?.payments?.length ? (
          entity.payments.map((payment, idx) => (
            <div
              key={idx}
              className="border border-dashed border-gray-400 p-1 my-1"
            >
              <div className="flex justify-between">
                <span>{formatCurrency(payment.amount)}</span>
                <span>{payment.payment_type}</span>
              </div>
              <div className="text-xs">
                {formatDate(new Date(payment.payment_date))}
              </div>
            </div>
          ))
        ) : (
          <div>No payments recorded</div>
        )}
      </div> */}

      <div className="mt-1 text-center">---- THANK YOU! ----</div>
    </div>
  )
})
SalesTransactionPrintContent.displayName = 'SalesTransactionPrintContent'
