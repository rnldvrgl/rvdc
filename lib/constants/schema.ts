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

    birthday: z
      .preprocess((arg) => {
        if (typeof arg === 'string' || arg instanceof Date) {
          return arg ? new Date(arg) : undefined
        }
        return undefined
      }, z.date().optional())
      .optional(),

    profile_image: z.any().optional(),
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
