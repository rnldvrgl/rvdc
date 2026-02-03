"use client"

import { Employee } from "@/lib/constants/types"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

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
    successMessage: "",
    invalidateQueries: sharedInvalidations,
    onSuccess: (data: any) => {
      // Show custom success message with credentials
      const username = data.username || "N/A"
      toast.success(
        <div className="space-y-2">
          <div className="font-semibold">Employee created successfully!</div>
          <div className="text-sm space-y-1">
            <div>
              <span className="font-medium">Username:</span> <code className="bg-muted px-1.5 py-0.5 rounded">{username}</code>
            </div>
            <div>
              <span className="font-medium">Password:</span> <code className="bg-muted px-1.5 py-0.5 rounded">rvdc12</code>
            </div>
            <div className="text-muted-foreground text-xs mt-1">
              Please share these credentials with the employee. They can change them in their profile settings.
            </div>
          </div>
        </div>,
        {
          duration: 10000, // Show for 10 seconds
        }
      )
    },
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
    successMessage: "Employee deleted successfully.",
    invalidateQueries: sharedInvalidations,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["employee", `${id}`] })
    },
  })

  return { addEmployee, updateEmployee, deleteEmployee }
}
