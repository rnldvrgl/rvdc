import { useApiMutation } from "@/lib/hooks/useApiMutation";
import type {
	GovernmentBenefit,
	GovernmentBenefitFormData,
} from "@/lib/schemas/governmentBenefitSchema";
import api from "@/lib/utils/api";

// API payload type with string dates (converted from Date objects in form)
type GovernmentBenefitApiPayload = Omit<
	GovernmentBenefitFormData,
	"effective_start" | "effective_end"
> & {
	effective_start: string;
	effective_end: string | null;
};

export const useCreateGovernmentBenefit = () => {
	return useApiMutation<GovernmentBenefitApiPayload, GovernmentBenefit>({
		mutationFn: (data) => api.post("/payroll/government-benefits/", data),
		successMessage: "Government benefit created successfully",
		invalidateQueries: [{ queryKey: ["government-benefits"] }],
	});
};

export const useUpdateGovernmentBenefit = () => {
	return useApiMutation<
		{ id: number; data: Partial<GovernmentBenefitApiPayload> },
		GovernmentBenefit
	>({
		mutationFn: ({ id, data }) =>
			api.patch(`/payroll/government-benefits/${id}/`, data),
		successMessage: "Government benefit updated successfully",
		invalidateQueries: [
			{ queryKey: ["government-benefits"] },
			{ queryKey: ["government-benefit"] },
		],
	});
};

export const useToggleGovernmentBenefit = () => {
	return useApiMutation<
		{ id: number; is_active: boolean },
		GovernmentBenefit
	>({
		mutationFn: ({ id, is_active }) =>
			api.patch(`/payroll/government-benefits/${id}/`, { is_active }),
		successMessage: "Benefit status updated successfully",
		invalidateQueries: [
			{ queryKey: ["government-benefits"] },
			{ queryKey: ["government-benefit"] },
		],
	});
};

export const useDeleteGovernmentBenefit = () => {
	return useApiMutation<number, unknown>({
		mutationFn: (id) => api.delete(`/payroll/government-benefits/${id}/`),
		successMessage: "Government benefit deleted successfully",
		invalidateQueries: [{ queryKey: ["government-benefits"] }],
	});
};

export const useBulkToggleGovernmentBenefits = () => {
	return useApiMutation<{ ids: number[]; is_active: boolean }, unknown>({
		mutationFn: async ({ ids, is_active }) => {
			const promises = ids.map((id) =>
				api.patch(`/payroll/government-benefits/${id}/`, { is_active }),
			);
			await Promise.all(promises);
		},
		successMessage: "Benefits updated successfully",
		invalidateQueries: [{ queryKey: ["government-benefits"] }],
	});
};
