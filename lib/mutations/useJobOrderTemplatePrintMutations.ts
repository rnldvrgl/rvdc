import { useApiMutation } from "@/lib/hooks/useApiMutation";
import api from "@/lib/utils/api";

export function useJobOrderTemplatePrintMutations() {
  const url = "services/jo-template-prints/"

  const recordPrint = useApiMutation({
    mutationFn: (data: { start_number: number; end_number: number }) =>
      api.post(url, data),
    successMessage: "Job order templates printed and recorded.",
    usePromiseToast: true,
    loadingMessage: "Recording printed templates...",
    invalidateQueries: [
      { queryKey: ["jo-template-prints"] },
      { queryKey: ["jo-next-number"] },
    ],
  })

  return { recordPrint }
}
