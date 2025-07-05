import { Item, ProductCategory, Stall } from '@/lib/constants/interface'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

const url = '/inventory/choices/'

const useItemChoices = () => {
  return useApiQuery<Item[]>(['item-choices'], `${url}items/`)
}

const useCategoryChoices = () => {
  return useApiQuery<ProductCategory[]>(
    ['category-choices'],
    `${url}categories/`,
  )
}

const useStallChoices = () => {
  return useApiQuery<Stall[]>(['stall-choices'], `${url}stalls/`)
}

export { useCategoryChoices, useItemChoices, useStallChoices }
