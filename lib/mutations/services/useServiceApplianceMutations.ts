"use client";

import { ServiceAppliancePayload } from "@/lib/constants/interface";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import api from "@/lib/utils/api";
import { useQueryClient } from "@tanstack/react-query";

export function useServiceApplianceMutations() {
	const queryClient = useQueryClient();
	const url = "services/service-appliances/";

	const addAppliance = useApiMutation({
		mutationFn: (data: ServiceAppliancePayload) => api.post(url, data),
		successMessage: "Appliance added successfully.",
		invalidateQueries: [
			{ queryKey: ["service-appliances"] },
			{ queryKey: ["services"] },
		],
		onSuccess: (_, variables) => {
			if (variables.service) {
				queryClient.invalidateQueries({
					queryKey: ["service", `${variables.service}`],
				});
			}
		},
	});

	const updateAppliance = useApiMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: number;
			data: ServiceAppliancePayload;
		}) => api.patch(`${url}${id}/`, data),
		successMessage: "Appliance updated successfully.",
		invalidateQueries: [
			{ queryKey: ["service-appliances"] },
			{ queryKey: ["services"] },
		],
		onSuccess: (_, variables) => {
			if (variables.data.service) {
				queryClient.invalidateQueries({
					queryKey: ["service", `${variables.data.service}`],
				});
			}
		},
	});

	const deleteAppliance = useApiMutation({
		mutationFn: ({ id }: { id: number; serviceId?: number }) =>
			api.delete(`${url}${id}/`),
		successMessage: "Appliance deleted successfully.",
		invalidateQueries: [
			{ queryKey: ["service-appliances"] },
			{ queryKey: ["services"] },
		],
		onSuccess: (_, variables) => {
			if (variables.serviceId) {
				queryClient.invalidateQueries({
					queryKey: ["service", `${variables.serviceId}`],
				});
			}
		},
	});

	return {
		addAppliance,
		updateAppliance,
		deleteAppliance,
	};
}
