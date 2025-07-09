import { Item, ProductCategory, Stall } from '@/lib/constants/interface'
import { Technician } from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

interface UseStallChoicesOptions {
  excludeAssignedStall?: boolean
  assignedStallId?: number | string
}

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

const useStallChoices = ({
  excludeAssignedStall,
  assignedStallId,
}: UseStallChoicesOptions) => {
  return useApiQuery<Stall[]>(
    ['stall-choices', { excludeAssignedStall, assignedStallId }],
    `${InventoryUrl}stalls/`,
    undefined,
    {
      select: (data) => {
        if (excludeAssignedStall && assignedStallId != null) {
          return data.filter((stall) => stall.id !== assignedStallId)
        }
        return data
      },
    },
  )
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
