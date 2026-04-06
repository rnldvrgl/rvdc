"use client"

import api from "@/lib/utils/api"
import { useApiMutation } from "@/lib/hooks/useApiMutation"

export interface CCTVCameraPayload {
  name: string
  stream_url: string
  location: string
  notes: string
  is_active: boolean
  order: number
}

export function useCCTVMutations() {
  const createCamera = useApiMutation<CCTVCameraPayload, unknown>({
    mutationFn: (data) => api.post("/surveillance/cameras/", data).then((r) => r.data),
    successMessage: "Camera added successfully",
    invalidateQueries: [{ queryKey: ["cctv-cameras"] }],
  })

  const updateCamera = useApiMutation<{ id: number } & Partial<CCTVCameraPayload>, unknown>({
    mutationFn: ({ id, ...data }) =>
      api.patch(`/surveillance/cameras/${id}/`, data).then((r) => r.data),
    successMessage: "Camera updated",
    invalidateQueries: [{ queryKey: ["cctv-cameras"] }],
  })

  const deleteCamera = useApiMutation<number, unknown>({
    mutationFn: (id) => api.delete(`/surveillance/cameras/${id}/`).then((r) => r.data),
    successMessage: "Camera removed",
    invalidateQueries: [{ queryKey: ["cctv-cameras"] }],
  })

  const syncAll = useApiMutation<void, unknown>({
    mutationFn: () => api.post("/surveillance/cameras/sync-all/").then((r) => r.data),
    successMessage: "Cameras synced to go2rtc",
    invalidateQueries: [{ queryKey: ["go2rtc-status"] }],
  })

  const syncOne = useApiMutation<number, unknown>({
    mutationFn: (id) =>
      api.post(`/surveillance/cameras/${id}/sync/`).then((r) => r.data),
    successMessage: "Camera synced",
    invalidateQueries: [{ queryKey: ["go2rtc-status"] }],
  })

  return { createCamera, updateCamera, deleteCamera, syncAll, syncOne }
}
