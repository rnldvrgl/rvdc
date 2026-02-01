"use client";

import { ExpenseCategoryPayload } from "@/lib/constants/interface";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import api from "@/lib/utils/api";
import { useQueryClient } from "@tanstack/react-query";

export function useExpenseCategoryMutations() {
	const queryClient = useQueryClient();
	const url = "/expenses/categories/";

	const sharedInvalidations = [
		{ queryKey: ["expense-categories"] },
		{ queryKey: ["expense-category-filters"] },
		{ queryKey: ["expense-category-choices"] },
		{ queryKey: ["expenses"] }, // Invalidate expenses too since they show category
	];

	const addExpenseCategory = useApiMutation({
		mutationFn: (data: ExpenseCategoryPayload) => api.post(url, data),
		successMessage: "Expense category created successfully.",
		invalidateQueries: sharedInvalidations,
	});

	const updateExpenseCategory = useApiMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: number;
			data: ExpenseCategoryPayload;
		}) => api.patch(`${url}${id}/`, data),
		successMessage: "Expense category updated successfully.",
		invalidateQueries: sharedInvalidations,
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["expense-category", variables.id],
			});
		},
	});

	const deleteExpenseCategory = useApiMutation({
		mutationFn: (id: number) => api.delete(`${url}${id}/`),
		successMessage: "Expense category deleted successfully.",
		invalidateQueries: sharedInvalidations,
	});

	const activateExpenseCategory = useApiMutation({
		mutationFn: (id: number) =>
			api.patch(`${url}${id}/`, { is_active: true }),
		successMessage: "Expense category activated successfully.",
		invalidateQueries: sharedInvalidations,
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({
				queryKey: ["expense-category", id],
			});
		},
	});

	const deactivateExpenseCategory = useApiMutation({
		mutationFn: (id: number) =>
			api.patch(`${url}${id}/`, { is_active: false }),
		successMessage: "Expense category deactivated successfully.",
		invalidateQueries: sharedInvalidations,
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({
				queryKey: ["expense-category", id],
			});
		},
	});

	return {
		addExpenseCategory,
		updateExpenseCategory,
		deleteExpenseCategory,
		activateExpenseCategory,
		deactivateExpenseCategory,
	};
}
