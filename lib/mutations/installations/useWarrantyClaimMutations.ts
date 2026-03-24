"use client"

import {
  FreeCleaningBatchPayload,
  FreeCleaningRedemptionPayload,
  WarrantyClaimCreatePayload,
  WarrantyClaimPayload,
} from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

export function useWarrantyClaimMutations() {
  const queryClient = useQueryClient()
  const url = "installations/warranty-claims/"

  const addWarrantyClaim = useApiMutation({
    mutationFn: (data: WarrantyClaimCreatePayload) =>
      api.post(url, data, {
        headers: { "Idempotency-Key": crypto.randomUUID() },
      }),
    successMessage: "Warranty claim created successfully.",
    invalidateQueries: [
      { queryKey: ["warranty-claims"] },
      { queryKey: ["aircon-units"] },
    ],
  })

  const updateWarrantyClaim = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<WarrantyClaimPayload>
    }) => api.patch(`${url}${id}/`, data),
    successMessage: "Warranty claim updated successfully.",
    invalidateQueries: [
      { queryKey: ["warranty-claims"] },
      { queryKey: ["aircon-units"] },
    ],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["warranty-claim", `${variables.id}`],
      })
    },
  })

  const deleteWarrantyClaim = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: "Warranty claim deleted successfully.",
    invalidateQueries: [
      { queryKey: ["warranty-claims"] },
      { queryKey: ["aircon-units"] },
    ],
  })

  const approveWarrantyClaim = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data?: {
        technician_assessment?: string
        create_service?: boolean
        scheduled_date?: string
        scheduled_time?: string
      }
    }) => api.post(`${url}${id}/approve/`, data ?? {}),
    successMessage: "Warranty claim approved successfully.",
    invalidateQueries: [
      { queryKey: ["warranty-claims"] },
      { queryKey: ["aircon-units"] },
      { queryKey: ["services"] },
    ],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["warranty-claim", `${variables.id}`],
      })
    },
  })

  const rejectWarrantyClaim = useApiMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.post(`${url}${id}/reject/`, { rejection_reason: reason }),
    successMessage: "Warranty claim rejected.",
    invalidateQueries: [
      { queryKey: ["warranty-claims"] },
      { queryKey: ["aircon-units"] },
    ],
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["warranty-claim", `${variables.id}`],
      })
    },
  })

  const cancelWarrantyClaim = useApiMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      api.post(`${url}${id}/cancel/`, { cancellation_reason: reason ?? "" }),
    successMessage: "Warranty claim cancelled.",
    invalidateQueries: [
      { queryKey: ["warranty-claims"] },
      { queryKey: ["aircon-units"] },
    ],
  })

  const completeWarrantyClaim = useApiMutation({
    mutationFn: (id: number) => api.post(`${url}${id}/complete/`),
    successMessage: "Warranty claim completed.",
    invalidateQueries: [
      { queryKey: ["warranty-claims"] },
      { queryKey: ["aircon-units"] },
      { queryKey: ["services"] },
    ],
  })

  const redeemFreeCleaning = useApiMutation({
    mutationFn: (data: FreeCleaningRedemptionPayload) =>
      api.post(`${url}redeem-free-cleaning/`, data),
    successMessage: "Free cleaning redeemed successfully.",
    invalidateQueries: [
      { queryKey: ["warranty-claims"] },
      { queryKey: ["aircon-units"] },
      { queryKey: ["services"] },
    ],
  })

  const checkWarrantyEligibility = useApiMutation({
    mutationFn: (unitId: number) =>
      api.post(`${url}check-eligibility/`, { unit_id: unitId }),
  })

  const checkFreeCleaningEligibility = useApiMutation({
    mutationFn: (unitId: number) =>
      api.post(`${url}check-free-cleaning/`, { unit_id: unitId }),
  })

  const redeemFreeCleaningBatch = useApiMutation({
    mutationFn: (data: FreeCleaningBatchPayload) =>
      api.post(`${url}redeem-free-cleaning-batch/`, data),
    successMessage:
      "Free cleaning redeemed successfully for all selected units.",
    invalidateQueries: [
      { queryKey: ["warranty-claims"] },
      { queryKey: ["aircon-units"] },
      { queryKey: ["services"] },
    ],
  })

  return {
    addWarrantyClaim,
    updateWarrantyClaim,
    deleteWarrantyClaim,
    approveWarrantyClaim,
    rejectWarrantyClaim,
    cancelWarrantyClaim,
    completeWarrantyClaim,
    redeemFreeCleaning,
    redeemFreeCleaningBatch,
    checkWarrantyEligibility,
    checkFreeCleaningEligibility,
  }
}
