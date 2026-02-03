"use client";

import { useSearchParams } from "next/navigation";

interface SearchParameters {
	page: number;
	limit: number;
	search?: string;
	ordering?: string;
	filter?: Record<string, string>;
}

const ALLOWED_LIMITS = [10, 20, 30, 40, 50];
const RESERVED_KEYS = new Set(["page", "limit", "search", "ordering"]);

const useSearchParameters = (): SearchParameters => {
	const searchParams = useSearchParams();

	const getString = (key: string): string | undefined => {
		const val = searchParams.get(key);
		return val?.trim() || undefined;
	};

	const getInt = (key: string, fallback: number): number => {
		const val = parseInt(searchParams.get(key) || "", 10);
		return isNaN(val) || val < 1 ? fallback : val;
	};

	const page = getInt("page", 1);

	const rawLimit = getInt("limit", 10);
	const limit = ALLOWED_LIMITS.includes(rawLimit) ? rawLimit : 10;

	const search = getString("search");
	const ordering = getString("ordering")?.toLowerCase();

	const filter: Record<string, string> = {};
	searchParams.forEach((value, key) => {
		if (!RESERVED_KEYS.has(key)) {
			filter[key] = value;
		}
	});

	return {
		page,
		limit,
		search,
		ordering,
		filter,
	};
};

export default useSearchParameters;
