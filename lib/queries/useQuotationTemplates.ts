import type { QuotationTermsTemplate } from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"

const url = "/quotations/templates/"

export function useQuotationTemplates(category?: string) {
  return useApiQuery<QuotationTermsTemplate[]>({
    queryKey: ["quotation-templates", category],
    url,
    params: {
      category: category || undefined,
    },
  })
}
