import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { useFilters } from "@/lib/hooks/useFilters";
import type {
	AdditionalEarning,
	PaginatedFilterProps,
	PaginatedResult,
	TimeEntry,
	WeeklyPayroll,
} from "@/lib/constants/types";

/**
 * Types
 */

export type ID = number;

type QueryParams = Record<string, string | number | boolean | undefined>;

/**
 * Endpoints
 */
const PAYROLL_BASE = "/payroll";

const TIME_ENTRIES = `${PAYROLL_BASE}/time-entries/`;
const TIME_ENTRY_DETAIL = (id: ID) => `${TIME_ENTRIES}${id}/`;

const ADDITIONAL_EARNINGS = `${PAYROLL_BASE}/additional-earnings/`;
const ADDITIONAL_EARNING_DETAIL = (id: ID) => `${ADDITIONAL_EARNINGS}${id}/`;

const WEEKLY_PAYROLLS = `${PAYROLL_BASE}/weekly-payrolls/`;
const weeklyPayrollDetail = (id: ID) => `${WEEKLY_PAYROLLS}${id}/`;
const weeklyPayrollFiltersUrl = `${WEEKLY_PAYROLLS}filters/`;

const PAYROLL_SETTINGS = `${PAYROLL_BASE}/settings/`;

const HOLIDAYS = `${PAYROLL_BASE}/holidays/`;

/**
 * Time Entries Queries
 */

// List time entries
export const useTimeEntries = (params?: QueryParams) => {
	return useApiQuery<PaginatedResult<TimeEntry>>({
		queryKey: ["payroll", "time-entries", params],
		url: TIME_ENTRIES,
		params,
	});
};

// Retrieve single time entry
export const useTimeEntry = (id?: ID) => {
	return useApiQuery<TimeEntry>({
		queryKey: ["payroll", "time-entry", id],
		url: id ? TIME_ENTRY_DETAIL(id) : "",
		options: { enabled: !!id },
	});
};

/**
 * Additional Earnings Queries
 */

// List additional earnings
export const useAdditionalEarnings = (params?: QueryParams) => {
	return useApiQuery<PaginatedResult<AdditionalEarning>>({
		queryKey: ["payroll", "additional-earnings", params],
		url: ADDITIONAL_EARNINGS,
		params,
	});
};

// Retrieve single additional earning
export const useAdditionalEarning = (id?: ID) => {
	return useApiQuery<AdditionalEarning>({
		queryKey: ["payroll", "additional-earning", id],
		url: id ? ADDITIONAL_EARNING_DETAIL(id) : "",
		options: { enabled: !!id },
	});
};

/**
 * Weekly Payroll Queries
 */

// List weekly payrolls
export const useWeeklyPayrolls = ({
	page = 1,
	limit = 10,
	search,
	ordering,
	filter = {},
}: PaginatedFilterProps) => {
	return useApiQuery<PaginatedResult<WeeklyPayroll>>({
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
		url: id ? weeklyPayrollDetail(id) : "",
		options: { enabled: !!id },
	});
};

// Weekly payroll filters metadata
export function useWeeklyPayrollFilters() {
	return useFilters("weekly-payroll-filters", weeklyPayrollFiltersUrl);
}

/**
 * Admin: Payroll Settings and Holidays Queries
 */

// Settings
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

// Holidays
export type Holiday = {
	id: ID;
	date: string; // YYYY-MM-DD
	name: string;
	kind: "regular" | "special";
	is_deleted: boolean;
};

export const useHolidays = ({
	page = 1,
	limit = 10,
	search,
	ordering,
	filter = {},
}: PaginatedFilterProps) => {
	return useApiQuery<PaginatedResult<Holiday>>({
		queryKey: [
			"payroll",
			"holidays",
			page,
			limit,
			search,
			ordering,
			filter,
		],
		url: HOLIDAYS,
		params: {
			page,
			limit,
			search: search || undefined,
			ordering: ordering || undefined,
			...filter,
		},
	});
};

export function useHolidayFilters() {
	return useFilters("holiday-filters", `${HOLIDAYS}filters/`);
}
