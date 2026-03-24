"use client"

import { AirconModels } from "@/lib/constants/interface"
import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

export function useAirconModelMutations() {
  const url = "/installations/aircon-models/"

  const addModel = useApiMutation({
    mutationFn: (data: Omit<AirconModels, "id">) => api.post(url, data),
    successMessage: "Model created successfully.",
    invalidateQueries: [{ queryKey: ["aircon-models"] }],
  })

  const updateModel = useApiMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<Omit<AirconModels, "id">>
    }) => api.patch(`${url}${id}/`, data),
    successMessage: "Model updated successfully.",
    invalidateQueries: [{ queryKey: ["aircon-models"] }],
  })

  const deleteModel = useApiMutation({
    mutationFn: (id: number) => api.delete(`${url}${id}/`),
    successMessage: "Model deleted successfully.",
    invalidateQueries: [{ queryKey: ["aircon-models"] }],
  })

  const bulkPreview = useApiMutation<FormData, unknown>({
    mutationFn: (formData) =>
      api.post(`${url}bulk-preview/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    usePromiseToast: true,
    loadingMessage: "Analyzing file...",
  })

  const bulkUpdate = useApiMutation<FormData, unknown>({
    mutationFn: (formData) =>
      api.post(`${url}bulk-update/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    usePromiseToast: true,
    loadingMessage: "Processing bulk update...",
    successMessage: "Bulk update started. You will be notified when it's done.",
    invalidateQueries: [{ queryKey: ["aircon-models"] }],
  })

  return { addModel, updateModel, deleteModel, bulkPreview, bulkUpdate }
}
