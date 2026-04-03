import type { ApplianceStatus } from "@/lib/constants/interface"
import { z } from "zod"

export const applianceStatusOptions: { value: ApplianceStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

export const applianceFormSchema = z.object({
  appliance_type: z.number().nullable(),
  brand: z.string(),
  model: z.string(),
  serial_number: z.string(),
  issue_reported: z.string(),
  diagnosis_notes: z.string(),
  status: z.enum(["pending", "completed", "cancelled"]),
  labor_fee: z.coerce.number().min(0, "Labor fee must be non-negative"),
  labor_is_free: z.boolean(),
  labor_original_amount: z.coerce.number().min(0),
  labor_discount_amount: z.coerce.number().min(0).optional(),
  labor_discount_reason: z.string().optional(),
  unit_price: z.coerce.number().min(0).nullable().optional(),
  total_service_fee: z.coerce.number().min(0).nullable().optional(),
  auto_adjust_labor: z.boolean(),
  labor_warranty_months: z.coerce.number().min(0),
  unit_warranty_months: z.coerce.number().min(0),
  warranty_notes: z.string(),
  parts_needed_notes: z.string(),
  assigned_technicians: z.array(z.number()),
  unit_type: z.enum(["brand_new", "second_hand", "pre_order"]).optional(),
  unit_id: z.number().optional(),
  model_id: z.number().optional(),
})

export type ApplianceFormValues = z.infer<typeof applianceFormSchema>

export const DEFAULT_VALUES: ApplianceFormValues = {
  appliance_type: null,
  brand: "",
  model: "",
  serial_number: "",
  issue_reported: "",
  diagnosis_notes: "",
  status: "pending",
  labor_fee: 0,
  labor_is_free: false,
  labor_original_amount: 0,
  total_service_fee: null,
  auto_adjust_labor: false,
  labor_warranty_months: 0,
  unit_warranty_months: 0,
  warranty_notes: "",
  parts_needed_notes: "",
  assigned_technicians: [],
}
