'use client'

import { SalesTransaction } from '@/lib/constants/interface'
import { formatCurrency, formatDate } from '@/lib/utils/helpers'
import React from 'react'

export const SalesTransactionPrintContent = React.forwardRef<
  HTMLDivElement,
  { entity: SalesTransaction | null }
>(({ entity }, ref) => {
  // console.log(entity)
  return (
    <div
      ref={ref}
      className="p-4 text-sm font-mono"
    >
      <h2 className="text-lg font-bold mb-2">SALES RECEIPT</h2>
      <div>Date: {formatDate(new Date(entity?.created_at ?? Date.now()))}</div>
      <div>Client: {entity?.client?.full_name ?? 'N/A'}</div>
      <div>Stall: {entity?.stall?.name ?? 'N/A'}</div>
      <div>
        Receipt #:{' '}
        {entity?.manual_receipt_number || entity?.system_receipt_number}
      </div>
      <div>
        Status:{' '}
        {entity?.voided ? 'VOIDED' : entity?.payment_status.toUpperCase()}
      </div>
      {entity?.voided && <div>Reason: {entity.void_reason ?? 'N/A'}</div>}

      <hr className="my-2" />

      <div>
        <strong>Items:</strong>
        {entity?.items.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between"
          >
            <span>
              {item.item?.name ?? 'Unnamed'} x {item.quantity}
            </span>
            <span>₱ {parseFloat(item.line_total).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <hr className="my-2" />

      <div className="flex justify-between">
        <strong>Total:</strong>
        <strong>{formatCurrency(Number(entity?.computed_total))}</strong>
      </div>

      <div>
        <strong>Payments:</strong>
        {entity?.payments?.length ? (
          entity.payments.map((payment, idx) => (
            <div key={idx}>
              {formatCurrency(payment.amount)} • {payment.payment_type} •{' '}
              {formatDate(new Date(payment.payment_date))}
            </div>
          ))
        ) : (
          <div>No payments recorded</div>
        )}
      </div>

      <div className="mt-4">--- THANK YOU! ---</div>
    </div>
  )
})
SalesTransactionPrintContent.displayName = 'SalesTransactionPrintContent'
