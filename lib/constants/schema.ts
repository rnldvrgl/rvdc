import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember_me: z.boolean().optional(),
})

export const userProfileSchema = z.object({
  email: z.string().email('Invalid email format').or(z.literal('')).optional(),
  current_password: z.string().optional(),
  new_password: z.string().optional(),
  username: z.string().min(2),
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  contact_number: z
    .string()
    .regex(/^\d{11}$/, 'Contact number must be exactly 11 digits')
    .or(z.literal(''))
    .optional(),
  birthday: z
    .preprocess((arg) => {
      if (typeof arg === 'string' || arg instanceof Date)
        return arg ? new Date(arg) : undefined
      return undefined
    }, z.date().optional())
    .optional(),
  profile_image: z.any().optional(),
})
