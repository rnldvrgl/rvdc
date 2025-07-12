import { Item, ProductCategory, Stall } from '@/lib/constants/interface'
import { Client, Technician } from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

interface UseStallChoicesOptions {
  excludeAssignedStall?: boolean
  assignedStallId?: number | string
}

const url = 'choices/'

const useItemChoices = () => {
  return useApiQuery<Item[]>(['item-choices'], `${url}items/`)
}

const useCategoryChoices = () => {
  return useApiQuery<ProductCategory[]>(
    ['category-choices'],
    `${url}categories/`,
  )
}

const useStallChoices = ({
  excludeAssignedStall,
  assignedStallId,
}: UseStallChoicesOptions) => {
  return useApiQuery<Stall[]>(
    ['stall-choices', { excludeAssignedStall, assignedStallId }],
    `${url}stalls/`,
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
  return useApiQuery<Technician[]>(['technician-choices'], `${url}technicians/`)
}

const useClientChoices = () => {
  return useApiQuery<Client[]>(['client-choices'], `${url}clients/`)
}
export {
  useCategoryChoices,
  useClientChoices,
  useItemChoices,
  useStallChoices,
  useTechnicianChoices,
}
