import {
  AirconBrands,
  AirconModels,
  Item,
  ProductCategory,
  Stall,
  User,
} from '@/lib/constants/interface'
import { Client, ComboboxOption, Technician } from '@/lib/constants/types'
import { useApiQuery } from '@/lib/hooks/useApiQuery'

interface UseStallChoicesOptions {
  excludeAssignedStall?: boolean
  assignedStallId?: number | string
}

const url = 'choices/'

export const useItemChoices = () => {
  return useApiQuery<Item[]>({
    queryKey: ['item-choices'],
    url: `${url}items/`,
  })
}

export const useCategoryChoices = () => {
  return useApiQuery<ProductCategory[]>({
    queryKey: ['category-choices'],
    url: `${url}categories/`,
  })
}

export const useStallChoices = ({
  excludeAssignedStall,
  assignedStallId,
}: UseStallChoicesOptions) => {
  return useApiQuery<Stall[]>({
    queryKey: ['stall-choices', { excludeAssignedStall, assignedStallId }],
    url: `${url}stalls/`,
    options: {
      select: (data) => {
        if (excludeAssignedStall && assignedStallId != null) {
          return data.filter((stall) => stall.id !== assignedStallId)
        }
        return data
      },
    },
  })
}

export const useTechnicianChoices = () => {
  return useApiQuery<Technician[]>({
    queryKey: ['technician-choices'],
    url: `${url}technicians/`,
  })
}

export const useClientChoices = () => {
  return useApiQuery<Client[]>({
    queryKey: ['client-choices'],
    url: `${url}clients/`,
  })
}

export const useUsersChoices = () => {
  return useApiQuery<User[]>({
    queryKey: ['users-choices'],
    url: `${url}users/`,
  })
}

export const useBanksChoices = () => {
  return useApiQuery<ComboboxOption[]>({
    queryKey: ['banks-choices'],
    url: `${url}banks/`,
  })
}

export const useAirconTypesChoices = () => {
  return useApiQuery<ComboboxOption[]>({
    queryKey: ['aircon-types-choices'],
    url: `${url}aircon-types/`,
  })
}

export const useAirconBrandsChoices = () => {
  return useApiQuery<AirconBrands[]>({
    queryKey: ['aircon-brands-choices'],
    url: `${url}aircon-brands/`,
  })
}

export const useAirconModelsChoices = () => {
  return useApiQuery<AirconModels[]>({
    queryKey: ['aircon-models-choices'],
    url: `${url}aircon-models/`,
  })
}
