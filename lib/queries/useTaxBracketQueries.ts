import { PaginatedFilterProps } from "@/lib/constants/types";
import { useApiQuery } from "../hooks/useApiQuery";
import { usePaginatedQuery } from "../hooks/usePaginatedQuery";

export interface TaxBracket {
	id: number;
	bracket_type: "bir" | "sss" | "philhealth" | "pagibig" | "custom";
	min_income: string;
	max_income: string | null;
	base_tax: string;
	rate: string;
	effective_start: string;
	effective_end: string | null;
	is_active: boolean;
	created_by: number | null;
	created_by_detail?: {
		id: number;
		username: string;
		first_name: string;
		last_name: string;
	};
	created_at: string;
}

/**
 * Fetch all tax brackets with pagination and optional filters
 */
export const useTaxBrackets = (props: PaginatedFilterProps = {}) => {
	return usePaginatedQuery<TaxBracket>({
		...props,
		queryKeyBase: "tax-brackets",
		url: "/payroll/tax-brackets/",
	});
};

/**
 * Fetch only active tax brackets (convenience hook)
 */
export const useActiveTaxBrackets = () => {
	return useApiQuery<TaxBracket[]>({
		queryKey: ["tax-brackets", "active"],
		url: "/payroll/tax-brackets/active/",
	});
};

/**
 * Fetch a single tax bracket by ID
 */
export const useTaxBracket = (id: number | null | undefined) => {
	return useApiQuery<TaxBracket>({
		queryKey: ["tax-bracket", id],
		url: `/payroll/tax-brackets/${id}/`,
		enabled: !!id,
	});
};
