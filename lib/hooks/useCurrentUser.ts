import useUserProfileStore from "@/lib/store/useUserProfileStore"

export const useCurrentUser = () => {
    const userProfile = useUserProfileStore((state) => state.userProfile)
    return {
        userProfile,
        user_id: userProfile?.id,
        role: userProfile?.role,
        assigned_stall: userProfile?.assigned_stall,
        first_name: userProfile?.first_name,
        last_name: userProfile?.last_name,
        isSuperAdmin: userProfile?.is_superuser === true,
        isAdmin: userProfile?.role === "admin",
        payrollIncluded: userProfile?.include_in_payroll ?? false,
        canManage: userProfile?.role === "manager" || userProfile?.role === "admin",
    }
}
