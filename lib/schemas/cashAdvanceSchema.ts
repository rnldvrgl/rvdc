import { z } from "zod"

export const cashAdvanceSchema = z.object({
  employee: z.number({
    required_error: "Employee is required",
  }),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be greater than 0",
    }),
  date: z.date({
    required_error: "Date is required",
  }),
  reason: z.string().optional(),
})

export type CashAdvanceFormValues = z.infer<typeof cashAdvanceSchema>
