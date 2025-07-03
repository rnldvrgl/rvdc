import { Item, ProductCategory } from '@/lib/constants/interface'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

const useItemChoices = () => {
  return useApiQuery<Item[]>(['item-choices'], '/inventory/choices/items/')
}

const useCategoryChoices = () => {
  return useApiQuery<ProductCategory[]>(
    ['category-choices'],
    '/inventory/choices/categories/',
  )
}

export { useCategoryChoices, useItemChoices }
