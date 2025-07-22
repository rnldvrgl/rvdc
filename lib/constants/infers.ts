import {
  CashDenominationBreakdownSchema,
  RemittancePayloadSchema,
  RemittanceRecordSchema,
} from '@/lib/constants/schema'
import z from 'zod'

export type RemittancePayload = z.infer<typeof RemittancePayloadSchema>
export type RemittanceRecord = z.infer<typeof RemittanceRecordSchema>
export type CashDenominationBreakdown = z.infer<
  typeof CashDenominationBreakdownSchema
>
