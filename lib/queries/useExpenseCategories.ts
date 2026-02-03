import { ExpenseCategory } from "@/lib/constants/interface";
import type { PaginatedFilterProps } from "@/lib/constants/types";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { useFilters } from "@/lib/hooks/useFilters";
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery";

const url = "/expenses/categories/";

/**
 * Fetch a single expense category by ID
 * Used in category detail views
 */
export function useExpenseCategory(id: number) {
	return useApiQuery<ExpenseCategory>({
		queryKey: ["expense-category", id],
		url: `${url}${id}/`,
		options: {
			enabled: !!id,
		},
	});
}

/**
 * Fetch paginated list of expense categories
 * Used in category management tables
 * For dropdowns, use useExpenseCategoryChoices from useChoices.ts instead
 */
export function useExpenseCategories(props: PaginatedFilterProps = {}) {
	return usePaginatedQuery<ExpenseCategory>({
		...props,
		url,
		queryKeyBase: "expense-categories",
	});
}

/**
 * Fetch filter options for expense categories
 * Used in category management DataTable filters
 */
export function useExpenseCategoryFilters() {
	return useFilters("expense-category-filters", `${url}filters/`);
}
