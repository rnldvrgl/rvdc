"use client"

import { useApiMutation } from "@/lib/hooks/useApiMutation"
import api from "@/lib/utils/api"

type ExportPayload = {
  export_type: string
  sheets: string
  start_date?: string
  end_date?: string
}

export function useExportMutations() {
  const startExport = useApiMutation<ExportPayload, unknown>({
    mutationFn: (data) => api.post("/analytics/export/", data),
    usePromiseToast: true,
    loadingMessage: "Starting export...",
    successMessage:
      "Export started. Your report will download automatically when ready.",
  })

  return { startExport }
}
