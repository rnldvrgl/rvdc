import {
  AirconModelSchema,
  AirconUnitSchema,
  DiscountOnlySchema,
  RemittanceRecordSchema,
} from '@/lib/constants/schema'
import z from 'zod'

export type RemittanceRecordPayload = z.infer<typeof RemittanceRecordSchema>
export type DiscountOnlyPayload = z.infer<typeof DiscountOnlySchema>
export type AirconModelPayload = z.infer<typeof AirconModelSchema>
export type AirconUnitPayload = z.infer<typeof AirconUnitSchema>
