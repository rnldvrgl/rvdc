import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/utils/api";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { useFilters } from "@/lib/hooks/useFilters";
import type { PaginatedFilterProps } from "@/lib/constants/types";

/**

 * Types

 */

export type ID = number;

export type PaginatedResponse<T> = {
	count: number;

	next: string | null;

	previous: string | null;

	results: T[];
};

export type TimeEntry = {
	id: ID;
	employee: ID;

	clock_in: string; // ISO DateTime

	clock_out: string; // ISO DateTime

	unpaid_break_minutes: number;

	source: "manual" | "schedule" | "import";

	approved: boolean;

	notes?: string;

	auto_closed: boolean;

	is_deleted: boolean;

	created_at: string;

	updated_at: string;

	// Computed (server-side) helpers may be attached

	effective_hours?: number;

	work_date?: string;
};

export type AdditionalEarning = {
	id: ID;
	employee: ID;

	earning_date: string; // ISO Date

	category: "overtime" | "installation_pct" | "custom";

	amount: string | number;

	description?: string;

	reference?: string;

	approved: boolean;

	is_deleted: boolean;

	created_at: string;

	updated_at: string;
};

export type WeeklyPayroll = {
	id: ID;

	employee: ID;

	employee_name?: string;

	week_start: string; // ISO Date

	week_end?: string; // ISO Date

	hourly_rate: string | number;

	overtime_threshold: string | number;

	overtime_multiplier: string | number;

	regular_hours: string | number;

	overtime_hours: string | number;

	night_diff_hours: string | number;

	approved_ot_hours: string | number;

	allowances: string | number;

	additional_earnings_total: string | number;

	gross_pay: string | number;

	night_diff_pay: string | number;

	approved_ot_pay: string | number;

	deductions: Record<string, string | number>;

	total_deductions: string | number;

	net_pay: string | number;

	status: "draft" | "approved" | "paid";

	notes?: string;

	is_deleted: boolean;

	created_at: string;

	updated_at: string;
};

type QueryParams = Record<string, string | number | boolean | undefined>;

/**

 * Endpoints
 */
const PAYROLL_BASE = "/payroll";
const TIME_ENTRIES = `${PAYROLL_BASE}/time-entries/`;

const TIME_ENTRIES_BULK = `${PAYROLL_BASE}/time-entries/bulk/`;

const ADDITIONAL_EARNINGS = `${PAYROLL_BASE}/additional-earnings/`;

const WEEKLY_PAYROLLS = `${PAYROLL_BASE}/weekly-payrolls/`;

const weeklyPayrollDetail = (id: ID) => `${WEEKLY_PAYROLLS}${id}/`;

const weeklyPayrollRecompute = (id: ID) => `${WEEKLY_PAYROLLS}${id}/recompute/`;

/**

 * Time Entries Queries and Mutations

 */

// List time entries

export const useTimeEntries = (params?: QueryParams) => {
	return useApiQuery<PaginatedResponse<TimeEntry>>({
		queryKey: ["payroll", "time-entries", params],

		url: TIME_ENTRIES,
		params,
	});
};

// Retrieve single time entry
export const useTimeEntry = (id?: ID) => {
	return useApiQuery<TimeEntry>({
		queryKey: ["payroll", "time-entry", id],

		url: `${TIME_ENTRIES}${id}/`,
		options: { enabled: !!id },
	});
};

// Create time entry
export const useCreateTimeEntry = () => {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: async (payload: Partial<TimeEntry>) => {
			const { data } = await api.post(TIME_ENTRIES, payload);

			return data as TimeEntry;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "time-entries"] });
		},
	});
};

// Update time entry

export const useUpdateTimeEntry = (id: ID) => {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: async (payload: Partial<TimeEntry>) => {
			const { data } = await api.patch(`${TIME_ENTRIES}${id}/`, payload);

			return data as TimeEntry;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "time-entries"] });

			qc.invalidateQueries({ queryKey: ["payroll", "time-entry", id] });
		},
	});
};

// Delete time entry (soft delete handled server-side if applicable)

export const useDeleteTimeEntry = (id: ID) => {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			await api.delete(`${TIME_ENTRIES}${id}/`);

			return true;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "time-entries"] });

			qc.invalidateQueries({ queryKey: ["payroll", "time-entry", id] });
		},
	});
};

// Bulk create time entries

export const useBulkCreateTimeEntries = () => {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: async (payload: Array<Partial<TimeEntry>>) => {
			const { data } = await api.post(TIME_ENTRIES_BULK, payload);

			return data as { created: number; ids?: ID[] };
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "time-entries"] });
		},
	});
};

/**
 * Additional Earnings Queries and Mutations

 */

// List additional earnings

export const useAdditionalEarnings = (params?: QueryParams) => {
	return useApiQuery<PaginatedResponse<AdditionalEarning>>({
		queryKey: ["payroll", "additional-earnings", params],

		url: ADDITIONAL_EARNINGS,
		params,
	});
};

// Retrieve single additional earning
export const useAdditionalEarning = (id?: ID) => {
	return useApiQuery<AdditionalEarning>({
		queryKey: ["payroll", "additional-earning", id],

		url: `${ADDITIONAL_EARNINGS}${id}/`,
		options: { enabled: !!id },
	});
};

// Create additional earning
export const useCreateAdditionalEarning = () => {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: async (payload: Partial<AdditionalEarning>) => {
			const { data } = await api.post(ADDITIONAL_EARNINGS, payload);

			return data as AdditionalEarning;
		},
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ["payroll", "additional-earnings"],
			});
		},
	});
};

// Update additional earning

export const useUpdateAdditionalEarning = (id: ID) => {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: async (payload: Partial<AdditionalEarning>) => {
			const { data } = await api.patch(
				`${ADDITIONAL_EARNINGS}${id}/`,
				payload,
			);

			return data as AdditionalEarning;
		},
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ["payroll", "additional-earnings"],
			});
			qc.invalidateQueries({
				queryKey: ["payroll", "additional-earning", id],
			});
		},
	});
};

// Delete additional earning

export const useDeleteAdditionalEarning = (id: ID) => {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			await api.delete(`${ADDITIONAL_EARNINGS}${id}/`);

			return true;
		},
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ["payroll", "additional-earnings"],
			});
			qc.invalidateQueries({
				queryKey: ["payroll", "additional-earning", id],
			});
		},
	});
};

/**
 * Weekly Payroll Queries and Mutations

 */

// List weekly payrolls

export const useWeeklyPayrolls = ({
	page = 1,

	limit = 10,

	search,

	ordering,

	filter = {},
}: PaginatedFilterProps) => {
	return useApiQuery<PaginatedResponse<WeeklyPayroll>>({
		queryKey: [
			"payroll",
			"weekly-payrolls",
			page,
			limit,
			search,
			ordering,
			filter,
		],

		url: WEEKLY_PAYROLLS,
		params: {
			page,
			limit,
			search: search || undefined,
			ordering: ordering || undefined,
			...filter,
		},
	});
};

// Retrieve single weekly payroll
export const useWeeklyPayroll = (id?: ID) => {
	return useApiQuery<WeeklyPayroll>({
		queryKey: ["payroll", "weekly-payroll", id],

		url: weeklyPayrollDetail(id as ID),
		options: { enabled: !!id },
	});
};

// Create weekly payroll
export const useCreateWeeklyPayroll = () => {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: async (payload: Partial<WeeklyPayroll>) => {
			const { data } = await api.post(WEEKLY_PAYROLLS, payload);

			return data as WeeklyPayroll;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "weekly-payrolls"] });
		},
	});
};

// Update weekly payroll

export const useUpdateWeeklyPayroll = (id: ID) => {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: async (payload: Partial<WeeklyPayroll>) => {
			const { data } = await api.patch(weeklyPayrollDetail(id), payload);

			return data as WeeklyPayroll;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "weekly-payrolls"] });

			qc.invalidateQueries({
				queryKey: ["payroll", "weekly-payroll", id],
			});
		},
	});
};

// Delete weekly payroll
export const useDeleteWeeklyPayroll = (id: ID) => {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			await api.delete(weeklyPayrollDetail(id));
			return true;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "weekly-payrolls"] });

			qc.invalidateQueries({
				queryKey: ["payroll", "weekly-payroll", id],
			});
		},
	});
};

export const useRecomputeWeeklyPayroll = (id: ID) => {
	const qc = useQueryClient();

	return useMutation({
		mutationFn: async (payload?: {
			include_unapproved?: boolean;
			allowances?: number;
			extra_flat_deductions?: Record<string, number>;
			percent_deductions?: Record<string, number>;
		}) => {
			const { data } = await api.post(
				weeklyPayrollRecompute(id),
				payload ?? {},
			);
			return data as WeeklyPayroll;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "weekly-payrolls"] });
			qc.invalidateQueries({
				queryKey: ["payroll", "weekly-payroll", id],
			});
		},
	});
};

export function useWeeklyPayrollFilters() {
	return useFilters("weekly-payroll-filters", `${WEEKLY_PAYROLLS}filters/`);
}

/**
 * Admin: Payroll Settings and Holidays
 */

// Settings
const PAYROLL_SETTINGS = `${PAYROLL_BASE}/settings/`;

export type PayrollSettings = {
	id: ID;
	shift_start: string;
	shift_end: string;
	grace_minutes: number;
	auto_close_enabled: boolean;
	holiday_day_hours: string | number;
	holiday_regular_pct: string | number;
	holiday_special_pct: string | number;
	regular_holiday_no_work_pays: boolean;
	special_holiday_no_work_pays: boolean;
	overtime_multiplier: string | number;
	night_diff_multiplier: string | number;
	updated_at: string;
};

export const usePayrollSettings = () => {
	return useApiQuery<PayrollSettings>({
		queryKey: ["payroll", "settings"],
		url: PAYROLL_SETTINGS,
	});
};

export const useUpdatePayrollSettings = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: Partial<PayrollSettings>) => {
			const { data } = await api.put(PAYROLL_SETTINGS, payload);
			return data as PayrollSettings;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "settings"] });
		},
	});
};

export const usePatchPayrollSettings = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: Partial<PayrollSettings>) => {
			const { data } = await api.patch(PAYROLL_SETTINGS, payload);
			return data as PayrollSettings;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "settings"] });
		},
	});
};

export type Holiday = {
	id: ID;

	date: string; // YYYY-MM-DD

	name: string;

	kind: "regular" | "special";
	is_deleted: boolean;
};

const HOLIDAYS = `${PAYROLL_BASE}/holidays/`;

export const useHolidays = (params?: QueryParams) => {
	return useApiQuery<PaginatedResponse<Holiday>>({
		queryKey: ["payroll", "holidays", params],
		url: HOLIDAYS,
		params,
	});
};

export const useCreateHoliday = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: Omit<Holiday, "id" | "is_deleted">) => {
			const { data } = await api.post(HOLIDAYS, payload);
			return data as Holiday;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "holidays"] });
		},
	});
};

export const useUpdateHoliday = (id: ID) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: Partial<Holiday>) => {
			const { data } = await api.patch(`${HOLIDAYS}${id}/`, payload);
			return data as Holiday;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "holidays"] });
		},
	});
};

export const useDeleteHoliday = (id: ID) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			await api.delete(`${HOLIDAYS}${id}/`);
			return true;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "holidays"] });
		},
	});
};
