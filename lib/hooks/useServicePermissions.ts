"use client"

import useUserProfileStore from "@/lib/store/useUserProfileStore"

/**
 * Hook to manage service-related permissions based on user role
 *
 * Permissions:
 * - Admin & Manager: Full edit access to service details and appliances
 * - Clerk: Can only add/edit parts used per appliance
 * - Technician: Read-only access
 */
export function useServicePermissions() {
  const userProfile = useUserProfileStore((state) => state.userProfile)
  const userRole = userProfile?.role

  // Admin and Manager can edit service details
  const canEditServiceDetails = userRole === "admin" || userRole === "manager"

  // Admin, Manager, and Clerk can manage parts (add/edit/delete parts used)
  const canManageParts =
    userRole === "admin" || userRole === "manager" || userRole === "clerk"

  // Admin and Manager can edit appliances (add/edit/delete appliances)
  const canEditAppliances = userRole === "admin" || userRole === "manager"

  // Admin and Manager can complete service
  const canCompleteService = userRole === "admin" || userRole === "manager"

  // Admin and Manager can cancel service
  const canCancelService = userRole === "admin" || userRole === "manager"

  // Admin and Manager can process refunds
  const canProcessRefunds = userRole === "admin" || userRole === "manager"

  // Admin and Manager can apply discounts
  const canApplyDiscounts = userRole === "admin" || userRole === "manager"

  // Admin and Manager can record payments
  const canRecordPayments = userRole === "admin" || userRole === "manager"

  return {
    userRole,
    canEditServiceDetails,
    canManageParts,
    canEditAppliances,
    canCompleteService,
    canCancelService,
    canProcessRefunds,
    canApplyDiscounts,
    canRecordPayments,
  }
}
