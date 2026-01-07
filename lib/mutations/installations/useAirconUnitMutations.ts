"use client";

import { AirconUnitPayload } from "@/lib/constants/interface";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import api from "@/lib/utils/api";

export function useAirconUnitMutations() {
	const url = "/installations/aircon-units/";

	const addUnit = useApiMutation({
		mutationFn: (data: AirconUnitPayload) => api.post(url, data),
		successMessage: "Aircon unit created successfully.",
		invalidateQueries: [{ queryKey: ["aircon-units"] }],
	});

	const updateUnit = useApiMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: number;
			data: Partial<AirconUnitPayload>;
		}) => api.patch(`${url}${id}/`, data),
		successMessage: "Aircon unit updated successfully.",
		invalidateQueries: [{ queryKey: ["aircon-units"] }],
	});

	const deleteUnit = useApiMutation({
		mutationFn: (id: number) => api.delete(`${url}${id}/`),
		successMessage: "Aircon unit deleted successfully.",
		invalidateQueries: [{ queryKey: ["aircon-units"] }],
	});

	return { addUnit, updateUnit, deleteUnit };
}
