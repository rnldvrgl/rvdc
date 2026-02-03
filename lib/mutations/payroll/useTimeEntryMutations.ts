"use client";

import { TimeEntry } from "@/lib/constants/types";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import api from "@/lib/utils/api";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Time Entry mutations module
 *
 * This file centralizes per-URL mutations for Time Entries and re-exports
 * the hooks from the core payroll mutations module. This keeps call sites
 * simple and aligns with the "separated per URL links" pattern.
 *
 * Endpoints covered:
 * - /payroll/time-entries/
 * - /payroll/time-entries/bulk/
 *

export function useTimeEntryMutations() {
/**
 * Time Entries Mutations
 */

export function useTimeEntryMutations() {
	const queryClient = useQueryClient();
	const PAYROLL_BASE = "/payroll";
	const TIME_ENTRIES = `${PAYROLL_BASE}/time-entries/`;
	const TIME_ENTRIES_BULK = `${PAYROLL_BASE}/time-entries/bulk`;
	const commonInvalidations = [
		{ queryKey: ["payroll", "time-entries"] },
		{ queryKey: ["clients"] },
	];

	const addTimeEntry = useApiMutation({
		mutationFn: (data: Partial<TimeEntry>) => api.post(TIME_ENTRIES, data),
		successMessage: "Time entry created successfully.",
		invalidateQueries: commonInvalidations,
	});

	const updateTimeEntry = useApiMutation({
		mutationFn: ({ id, data }: { id: number; data: Partial<TimeEntry> }) =>
			api.patch(`${TIME_ENTRIES}${id}/`, data),
		successMessage: "Time entry updated successfully.",
		invalidateQueries: commonInvalidations,
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["payroll", "time-entry", `${variables.id}`],
			});
		},
	});

	const deleteTimeEntry = useApiMutation({
		mutationFn: (id: number) => api.delete(`${TIME_ENTRIES}${id}/`),
		successMessage: "Time entry deleted.",
		invalidateQueries: commonInvalidations,
	});

	const bulkCreateTimeEntries = useApiMutation({
		mutationFn: (data: Array<Partial<TimeEntry>>) =>
			api.post(TIME_ENTRIES_BULK, data),
		successMessage: "Time entries created successfully.",
		invalidateQueries: commonInvalidations,
	});

	return {
		addTimeEntry,
		updateTimeEntry,
		deleteTimeEntry,
		bulkCreateTimeEntries,
	};
}
