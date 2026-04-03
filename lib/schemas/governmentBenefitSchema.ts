import { z } from "zod";

export const governmentBenefitSchema = z
	.object({
		benefit_type: z.enum(["sss", "philhealth", "pagibig", "bir_tax"], {
			required_error: "Benefit type is required",
		}),
		name: z
			.string()
			.min(1, "Name is required")
			.max(100, "Name is too long"),
		calculation_method: z.enum(["fixed", "percentage"], {
			required_error: "Calculation method is required",
		}),
		period_type: z.enum(["weekly", "monthly"], {
			required_error: "Period type is required",
		}),
		employee_share_amount: z
			.number()
			.nonnegative("Amount must be non-negative")
			.nullable()
			.optional(),
		employer_share_amount: z
			.number()
			.nonnegative("Amount must be non-negative")
			.nullable()
			.optional(),
		employee_share_rate: z
			.number()
			.min(0, "Rate must be between 0 and 1")
			.max(1, "Rate must be between 0 and 1")
			.nullable()
			.optional(),
		employer_share_rate: z
			.number()
			.min(0, "Rate must be between 0 and 1")
			.max(1, "Rate must be between 0 and 1")
			.nullable()
			.optional(),
		effective_start: z.date({
			required_error: "Effective start date is required",
		}),
		effective_end: z.date().optional(),
		is_active: z.boolean(),
		description: z.string().optional(),
	})
	.refine(
		(data) => {
			// Validate required fields based on calculation_method
			if (data.calculation_method === "fixed") {
				return (
					data.employee_share_amount != null &&
					data.employee_share_amount !== undefined &&
					data.employee_share_amount > 0
				);
			}
			if (data.calculation_method === "percentage") {
				return (
					data.employee_share_rate != null &&
					data.employee_share_rate !== undefined &&
					data.employee_share_rate > 0
				);
			}
			// No additional validation for progressive_tax needed
			return true;
		},
		{
			message: "Required fields missing for selected calculation method",
			path: ["calculation_method"],
		},
	)
	.refine(
		(data) => {
			// Validate effective_end is after effective_start
			if (data.effective_end) {
				return data.effective_end >= data.effective_start;
			}
			return true;
		},
		{
			message: "End date must be on or after start date",
			path: ["effective_end"],
		},
	);

export type GovernmentBenefitFormData = z.infer<typeof governmentBenefitSchema>;

export interface GovernmentBenefit {
	id: number;
	benefit_type: "sss" | "philhealth" | "pagibig" | "bir_tax";
	name: string;
	calculation_method: "fixed" | "percentage";
	period_type: "weekly" | "monthly";
	employee_share_amount: string | null;
	employer_share_amount: string | null;
	employee_share_rate: string | null;
	employer_share_rate: string | null;
	effective_start: Date | string;
	effective_end: Date | string | null;
	is_active: boolean;
	description: string;
	created_by: number | null;
	created_by_detail?: {
		id: number;
		username: string;
		first_name: string;
		last_name: string;
		full_name: string;
	};
	created_at: Date | string;
	updated_at: Date | string;
}

export interface PayrollDeduction {
	id: number;
	payroll: number;
	category: "manual" | "government" | "tax" | "late_penalty" | "other";
	name: string;
	description: string;
	employee_share: string;
	employer_share: string;
	total_amount: string;
	source_type: string;
	source_id: number | null;
	calculation_method: string;
	basis_amount: string | null;
	rate: string | null;
	applied_date: string;
	created_at: string;
}
