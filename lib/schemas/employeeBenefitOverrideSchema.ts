import { z } from "zod"

export const employeeBenefitOverrideSchema = z.object({
  employee: z.number({
    required_error: "Employee is required",
  }),
  benefit_type: z.enum(["sss", "philhealth", "pagibig", "bir_tax"], {
    required_error: "Benefit type is required",
  }),
  employee_share_amount: z
    .number({
      required_error: "Employee share amount is required",
    })
    .min(1, "Amount must be positive"),
  employer_share_amount: z
    .number()
    .min(0, "Amount must be positive")
    .optional()
    .nullable(),
  effective_start: z.date({
    required_error: "Effective start date is required",
  }),
  effective_end: z.date().optional(),
  is_active: z.boolean(),
  notes: z.string().optional(),
})

export type EmployeeBenefitOverrideFormData = z.infer<
  typeof employeeBenefitOverrideSchema
>

export interface EmployeeBenefitOverride {
  id: number
  employee: number
  employee_name?: string
  benefit_type: "sss" | "philhealth" | "pagibig" | "bir_tax"
  benefit_type_display?: string
  employee_share_amount: number
  employer_share_amount?: number | null
  effective_start: string
  effective_end?: string
  is_active: boolean
  notes?: string
  created_at?: string
  updated_at?: string
  created_by?: number
}
