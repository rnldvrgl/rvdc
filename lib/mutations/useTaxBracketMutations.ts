import { useApiMutation } from "@/lib/hooks/useApiMutation";
import api from "@/lib/utils/api";
import { TaxBracket } from "@/lib/queries/useTaxBracketQueries";

export interface TaxBracketFormData {
	bracket_type: "bir" | "sss" | "philhealth" | "pagibig" | "custom";
	min_income: number;
	max_income?: number | null;
	base_tax: number;
	rate: number;
	effective_start: string;
	effective_end?: string | null;
	is_active?: boolean;
}

/**
 * Create a new tax bracket
 */
export const useCreateTaxBracket = () => {
	return useApiMutation<TaxBracketFormData, TaxBracket>({
		mutationFn: (data) => api.post("/payroll/tax-brackets/", data),
		successMessage: "Tax bracket created successfully",
		invalidateQueries: [{ queryKey: ["tax-brackets"] }],
	});
};

/**
 * Update an existing tax bracket
 */
export const useUpdateTaxBracket = () => {
	return useApiMutation<
		{ id: number } & Partial<TaxBracketFormData>,
		TaxBracket
	>({
		mutationFn: ({ id, ...data }) =>
			api.patch(`/payroll/tax-brackets/${id}/`, data),
		successMessage: "Tax bracket updated successfully",
		invalidateQueries: [
			{ queryKey: ["tax-brackets"] },
			{ queryKey: ["tax-bracket"] },
		],
	});
};

/**
 * Delete a tax bracket
 */
export const useDeleteTaxBracket = () => {
	return useApiMutation<number, unknown>({
		mutationFn: (id) => api.delete(`/payroll/tax-brackets/${id}/`),
		successMessage: "Tax bracket deleted successfully",
		invalidateQueries: [{ queryKey: ["tax-brackets"] }],
	});
};

/**
 * Toggle tax bracket active status
 */
export const useToggleTaxBracketStatus = () => {
	return useApiMutation<{ id: number; is_active: boolean }, TaxBracket>({
		mutationFn: ({ id, is_active }) =>
			api.patch(`/payroll/tax-brackets/${id}/`, { is_active }),
		successMessage: "Tax bracket status updated successfully",
		invalidateQueries: [
			{ queryKey: ["tax-brackets"] },
			{ queryKey: ["tax-bracket"] },
		],
	});
};
