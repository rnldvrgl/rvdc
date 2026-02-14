import { z } from "zod"

export const cashAdvanceMovementSchema = z.object({
  employee: z.number({
    required_error: "Employee is required",
  }),
  movement_type: z.enum(["credit", "debit"], {
    required_error: "Movement type is required",
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
  description: z.string().optional(),
  reference: z.string().optional(),
})

export type CashAdvanceMovementFormValues = z.infer<
  typeof cashAdvanceMovementSchema
>
