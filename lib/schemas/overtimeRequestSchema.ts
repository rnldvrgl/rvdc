import { z } from "zod"

/**
 * Overtime Request Form Schema
 * Employee fills out overtime request with date, time range, and reason
 */
export const overtimeRequestSchema = z
  .object({
    employee: z.number().int().positive("Employee is required"),
    date: z.date({ required_error: "Date is required" }),
    time_start: z.date({ required_error: "Start time is required" }),
    time_end: z.date({ required_error: "End time is required" }),
    reason: z.string().optional(),
  })
  .refine((data) => data.time_end > data.time_start, {
    message: "End time must be after start time",
    path: ["time_end"],
  })

export type OvertimeRequestFormData = z.infer<typeof overtimeRequestSchema>
