import { AirconTypes, ChequeStatus } from "@/lib/constants/general"
import { z } from "zod"

export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember_me: z.boolean().optional(),
})

export const userProfileSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email format")
      .or(z.literal(""))
      .optional(),

    current_password: z
      .string()
      .transform((val) => val.trim())
      .optional(),

    new_password: z
      .string()
      .transform((val) => val.trim())
      .refine(
        (val) => val === "" || val.length >= 6,
        "New password must be at least 6 characters or empty",
      )
      .optional(),

    username: z.string().min(2, "Username must be at least 2 characters"),
    first_name: z.string().min(2, "First name must be at least 2 characters"),
    last_name: z.string().min(2, "Last name must be at least 2 characters"),

    contact_number: z
      .string()
      .regex(/^\d{11}$/, "Contact number must be exactly 11 digits")
      .or(z.literal(""))
      .optional(),

    birthday: z.date().optional(),

    profile_image: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const currentFilled =
      data.current_password && data.current_password.trim() !== ""
    const newFilled = data.new_password && data.new_password.trim() !== ""

    if (currentFilled && !newFilled) {
      ctx.addIssue({
        path: ["new_password"],
        code: z.ZodIssueCode.custom,
        message: "Required with current password",
      })
    }

    if (newFilled && !currentFilled) {
      ctx.addIssue({
        path: ["current_password"],
        code: z.ZodIssueCode.custom,
        message: "Required with new password",
      })
    }
  })

export const CashDenominationBreakdownPayloadSchema = z.object({
  count_1000: z.number().min(0).optional(),
  count_500: z.number().min(0).optional(),
  count_200: z.number().min(0).optional(),
  count_100: z.number().min(0).optional(),
  count_50: z.number().min(0).optional(),
  count_20: z.number().min(0).optional(),
  count_10: z.number().min(0).optional(),
  count_5: z.number().min(0).optional(),
  count_1: z.number().min(0).optional(),

  declared_count_1: z.number().min(0).optional(),
  declared_count_5: z.number().min(0).optional(),
  declared_count_10: z.number().min(0).optional(),
  declared_count_20: z.number().min(0).optional(),
  declared_count_50: z.number().min(0).optional(),
  declared_count_100: z.number().min(0).optional(),
  declared_count_200: z.number().min(0).optional(),
  declared_count_500: z.number().min(0).optional(),
  declared_count_1000: z.number().min(0).optional(),
})

export const RemittanceRecordSchema = z.object({
  id: z.number().optional(),
  stall: z.number(),
  notes: z.string(),

  cash_breakdown: CashDenominationBreakdownPayloadSchema.optional(),

  is_remitted: z.boolean().optional(),
})

export const ChequeCollectionSchema = z
  .object({
    client: z.number({ required_error: "Client is required" }),
    collected_by: z
      .number({ required_error: "Collector is required" })
      .optional(),
    issued_by: z
      .string({ required_error: "Issued by is required" })
      .trim()
      .min(1, { message: "Issued by is required" }),

    bank_name: z
      .string({ required_error: "Bank is required" })
      .trim()
      .min(1, { message: "Bank is required" }),
    deposit_bank: z.string().trim().optional(),
    cheque_number: z
      .string({ required_error: "Cheque number is required" })
      .trim()
      .min(1, { message: "Cheque number is required" }),

    cheque_amount: z
      .number({ required_error: "Amount is required" })
      .positive({ message: "Amount must be greater than 0" }),
    billing_amount: z
      .number({ required_error: "Billing amount is required" })
      .positive({ message: "Billing amount must be greater than 0" }),

    or_number: z.string().trim().optional(),

    cheque_date: z.date({ required_error: "Cheque date is required" }),
    date_collected: z.date().optional(),

    notes: z.string().trim().optional(),

    status: z.enum(
      [
        ChequeStatus.PENDING,
        ChequeStatus.DEPOSITED,
        ChequeStatus.ENCAHSED,
        ChequeStatus.RETURNED,
        ChequeStatus.BOUNCED,
        ChequeStatus.CANCELLED,
      ],
      { required_error: "Status is required" },
    ),
  })
  .refine(
    (data) =>
      ![ChequeStatus.DEPOSITED, ChequeStatus.ENCAHSED].includes(data.status) ||
      (data.deposit_bank && data.deposit_bank.trim().length > 0),
    {
      message: "Deposit bank is required when status is encashed or deposited",
      path: ["deposit_bank"],
    },
  )

export const DiscountOnlySchema = z.object({
  discount_percentage: z.number().int().min(0).max(100).optional(),
})

export const AirconModelSchema = z.object({
  brand_id: z.number().min(1, "Brand is required"),
  name: z.string().min(1, "Model name is required"),
  retail_price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price"),
  discount_percentage: z.number().min(0).max(100).optional(),
  aircon_type: z.nativeEnum(AirconTypes),
  is_inverter: z.boolean(),
})

export const AirconUnitSchema = z.object({
  serial_number: z
    .string()
    .min(1, "Serial number is required")
    .max(255, "Serial number too long"),

  // Always optional — backend decides if it's linked
  model_id: z.number(),

  // Required only when sold
  sale: z.number().optional().nullable(),

  // Required only when installed
  installation: z.number().optional().nullable(),

  // Reservation fields (optional, only needed if reserved)
  reserved_by: z.number().optional().nullable(),

  // Always present, default is false
  free_cleaning_redeemed: z.boolean().optional(),
})
