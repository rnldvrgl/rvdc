import type { QuotationPriceListTemplate } from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"

const url = "/quotations/price-list-templates/"

export function useQuotationPriceListTemplates() {
  return useApiQuery<QuotationPriceListTemplate[]>({
    queryKey: ["quotation-price-list-templates"],
    url,
  })
}
