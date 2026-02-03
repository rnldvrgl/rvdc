import { z } from "zod"

export const manualDeductionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().optional(),
  deduction_type: z.enum(["per_employee", "recurring_all", "onetime_all"], {
    required_error: "Deduction type is required",
  }),
  employee: z.number().nullable().optional(),
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be greater than zero"),
  effective_date: z.string().optional(),
  end_date: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
})

export type ManualDeductionFormData = z.infer<typeof manualDeductionSchema>

export interface ManualDeduction {
  id: number
  name: string
  description: string
  deduction_type: "per_employee" | "recurring_all" | "onetime_all"
  deduction_type_display: string
  employee: number | null
  employee_detail?: {
    id: number
    username: string
    first_name: string
    last_name: string
    full_name: string
  }
  amount: string
  effective_date: string | null
  end_date: string | null
  is_active: boolean
  applied_date: string | null
  is_deleted: boolean
  created_by: number | null
  created_by_detail?: {
    id: number
    username: string
    first_name: string
    last_name: string
    full_name: string
  }
  created_at: string
  updated_at: string
}
