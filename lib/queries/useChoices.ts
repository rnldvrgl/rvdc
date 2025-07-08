import { Item, ProductCategory, Stall } from '@/lib/constants/interface'
import { Technician } from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

const InventoryUrl = '/inventory/choices/'
const UsersUrl = '/users/choices/'

const useItemChoices = () => {
  return useApiQuery<Item[]>(['item-choices'], `${InventoryUrl}items/`)
}

const useCategoryChoices = () => {
  return useApiQuery<ProductCategory[]>(
    ['category-choices'],
    `${InventoryUrl}categories/`,
  )
}

const useStallChoices = () => {
  return useApiQuery<Stall[]>(['stall-choices'], `${InventoryUrl}stalls/`)
}

const useTechnicianChoices = () => {
  return useApiQuery<Technician[]>(
    ['technician-choices'],
    `${UsersUrl}technicians/`,
  )
}
export {
  useCategoryChoices,
  useItemChoices,
  useStallChoices,
  useTechnicianChoices,
}
