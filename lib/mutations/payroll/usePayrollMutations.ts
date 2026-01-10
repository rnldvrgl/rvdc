"use client";

import {
	useApiMutation,
	useApiMutation as useMutation,
} from "@/lib/hooks/useApiMutation";
import { useQueryClient } from "@tanstack/react-query";

import api from "@/lib/utils/api";
import { Holiday, PayrollSettings } from "@/lib/queries/usePayroll";
import { AdditionalEarning, WeeklyPayroll } from "@/lib/constants/types";

/**
 * Endpoints (aligned with usePayroll queries)
 */
const PAYROLL_BASE = "/payroll";
const ADDITIONAL_EARNINGS = `${PAYROLL_BASE}/additional-earnings/`;
const WEEKLY_PAYROLLS = `${PAYROLL_BASE}/weekly-payrolls/`;
const PAYROLL_SETTINGS = `${PAYROLL_BASE}/settings/`;
const HOLIDAYS = `${PAYROLL_BASE}/holidays/`;

const weeklyPayrollDetail = (id: number) => `${WEEKLY_PAYROLLS}${id}/`;
const weeklyPayrollRecompute = (id: number) =>
	`${WEEKLY_PAYROLLS}${id}/recompute/`;

/**
 * Centralized mutations for Payroll domain
 * - Time Entries
 * - Additional Earnings
 * - Weekly Payrolls
 * - Payroll Settings
 * - Holidays
 *
 * All mutations invalidate the corresponding query caches used in usePayroll queries.
 */

/**
 * Additional Earnings Mutations
 */
export const useCreateAdditionalEarning = () => {
	const qc = useQueryClient();

	return useApiMutation({
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

export const useUpdateAdditionalEarning = (id: number) => {
	const qc = useQueryClient();

	return useApiMutation({
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

export const useDeleteAdditionalEarning = (id: number) => {
	const qc = useQueryClient();

	return useApiMutation({
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
 * Weekly Payroll Mutations
 */
export const useCreateWeeklyPayroll = () => {
	const qc = useQueryClient();

	return useApiMutation({
		mutationFn: async (payload: Partial<WeeklyPayroll>) => {
			const { data } = await api.post(WEEKLY_PAYROLLS, payload);
			return data as WeeklyPayroll;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "weekly-payrolls"] });
		},
	});
};

export const useUpdateWeeklyPayroll = (id: number) => {
	const qc = useQueryClient();

	return useApiMutation({
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

export const useDeleteWeeklyPayroll = (id: number) => {
	const qc = useQueryClient();

	return useApiMutation({
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

export const useRecomputeWeeklyPayroll = (id: number) => {
	const qc = useQueryClient();

	return useApiMutation({
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

/**
 * Payroll Settings Mutations
 */
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
	return useApiMutation({
		mutationFn: async (payload: Partial<PayrollSettings>) => {
			const { data } = await api.patch(PAYROLL_SETTINGS, payload);
			return data as PayrollSettings;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "settings"] });
		},
	});
};

/**
 * Holidays Mutations
 */
export const useCreateHoliday = () => {
	const qc = useQueryClient();
	return useApiMutation({
		mutationFn: async (payload: Omit<Holiday, "id" | "is_deleted">) => {
			const { data } = await api.post(HOLIDAYS, payload);
			return data as Holiday;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "holidays"] });
		},
	});
};

export const useUpdateHoliday = (id: number) => {
	const qc = useQueryClient();
	return useApiMutation({
		mutationFn: async (payload: Partial<Holiday>) => {
			const { data } = await api.patch(`${HOLIDAYS}${id}/`, payload);
			return data as Holiday;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "holidays"] });
		},
	});
};

export const useDeleteHoliday = (id: number) => {
	const qc = useQueryClient();
	return useApiMutation({
		mutationFn: async () => {
			await api.delete(`${HOLIDAYS}${id}/`);
			return true;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["payroll", "holidays"] });
		},
	});
};
