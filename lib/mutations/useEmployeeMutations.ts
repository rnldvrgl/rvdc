"use client"

import { Employee } from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"

export function useEmployeeMutations() {
  const queryClient = useQueryClient()
  const url = "/users/employees/"

  const sharedInvalidations = [
    { queryKey: ["employees"] },
    { queryKey: ["employee-choices"] },
    { queryKey: ["calendar-events"] },
  ]

  const addEmployee = useApiMutation({
    mutationFn: (data: Employee) => api.post(url, data),
    // Don't use default success message, we'll handle it in onSuccess
    successMessage: "Added employee successfully.",
    invalidateQueries: sharedInvalidations,
  })

  const updateEmployee = useApiMutation({
    mutationFn: ({ id, data }: { id: number; data: Employee }) =>
      api.patch(`${url}${id}/`, data),
    successMessage: "Employee updated successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["employee", `${id}`] })
    },
  })

  const deleteEmployee = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: "Employee deactivated successfully.",
    invalidateQueries: [
      ...sharedInvalidations,
      { queryKey: ["employees-archived"] },
    ],
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["employee", `${id}`] })
    },
  })

  const bulkPreview = useApiMutation<FormData, unknown>({
    mutationFn: (formData) =>
      api.post("/users/employees/bulk-preview/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    usePromiseToast: true,
    loadingMessage: "Analyzing file...",
  })

  const bulkUpdate = useApiMutation<FormData, unknown>({
    mutationFn: (formData) =>
      api.post("/users/employees/bulk-update/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    usePromiseToast: true,
    loadingMessage: "Processing bulk update...",
    successMessage: "Bulk update started. You will be notified when it's done.",
    invalidateQueries: sharedInvalidations,
  })

  return {
    addEmployee,
    updateEmployee,
    deleteEmployee,
    bulkPreview,
    bulkUpdate,
  }
}
