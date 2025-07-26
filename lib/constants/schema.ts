import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember_me: z.boolean().optional(),
})

export const userProfileSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email format')
      .or(z.literal(''))
      .optional(),

    current_password: z
      .string()
      .transform((val) => val.trim())
      .optional(),

    new_password: z
      .string()
      .transform((val) => val.trim())
      .refine(
        (val) => val === '' || val.length >= 6,
        'New password must be at least 6 characters or empty',
      )
      .optional(),

    username: z.string().min(2, 'Username must be at least 2 characters'),
    first_name: z.string().min(2, 'First name must be at least 2 characters'),
    last_name: z.string().min(2, 'Last name must be at least 2 characters'),

    contact_number: z
      .string()
      .regex(/^\d{11}$/, 'Contact number must be exactly 11 digits')
      .or(z.literal(''))
      .optional(),

    birthday: z.date().optional(),

    profile_image: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const currentFilled =
      data.current_password && data.current_password.trim() !== ''
    const newFilled = data.new_password && data.new_password.trim() !== ''

    if (currentFilled && !newFilled) {
      ctx.addIssue({
        path: ['new_password'],
        code: z.ZodIssueCode.custom,
        message: 'Required with current password',
      })
    }

    if (newFilled && !currentFilled) {
      ctx.addIssue({
        path: ['current_password'],
        code: z.ZodIssueCode.custom,
        message: 'Required with new password',
      })
    }
  })

export const CashDenominationBreakdownPayloadSchema = z.object({
  count_1000: z.number().min(0).optional(),
  count_500: z.number().min(0).optional(),
  count_100: z.number().min(0).optional(),
  count_50: z.number().min(0).optional(),
  count_20: z.number().min(0).optional(),
  count_10: z.number().min(0).optional(),
  count_5: z.number().min(0).optional(),
  count_1: z.number().min(0).optional(),
  coins_remitted: z.boolean().default(false).optional(),
})

export const RemittancePayloadSchema = z.object({
  id: z.number().optional(),
  stall: z.number(),
  notes: z.string().optional(),
  is_remitted: z.boolean().default(false).optional(),
  cash_breakdown: CashDenominationBreakdownPayloadSchema.optional(),
})

export const CashDenominationBreakdownSchema =
  CashDenominationBreakdownPayloadSchema.extend({
    total_remitted_amount: z.number(),
    cod_amount: z.number(),
    total_cash_declared: z.number(),
  })

export const RemittanceRecordSchema = z.object({
  id: z.number(),
  stall: z.number(),
  stall_data: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .optional(),
  created_at: z.string(),
  remitted_amount: z.string(),
  remitted_by: z.number().nullable(),
  notes: z.string(),
  expected_remittance: z.string(),
  total_collected: z.string(),
  balance: z.string(),

  total_sales_cash: z.string(),
  total_sales_gcash: z.string(),
  total_sales_credit: z.string(),
  total_sales_debit: z.string(),
  total_sales_cheque: z.string(),
  total_expenses: z.string(),

  cash_breakdown: CashDenominationBreakdownSchema.optional(),

  is_remitted: z.boolean(),
})
