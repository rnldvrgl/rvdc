import { RemittanceRecordSchema } from '@/lib/constants/schema'
import z from 'zod'

export type RemittanceRecordPayload = z.infer<typeof RemittanceRecordSchema>
