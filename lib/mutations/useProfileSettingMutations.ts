"use client";

import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { UserProfilePayload } from "@/lib/constants/types";
import api from "@/lib/utils/api";

export function useProfileSettingMutations() {
	const url = "/users/profile/";

	const commonInvalidations = [{ queryKey: ["user-profile"] }];

	const updateUserProfile = useApiMutation({
		mutationFn: (data: Partial<UserProfilePayload>) => api.patch(url, data),
		successMessage: "Profile updated successfully.",
		invalidateQueries: commonInvalidations,
	});

	return {
		updateUserProfile,
	};
}
