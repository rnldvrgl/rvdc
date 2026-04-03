import {
  AirconBrands,
  AirconModels,
  ApplianceType,
  ExpenseCategory,
  Item,
  ProductCategory,
  Stall,
  User,
} from "@/lib/constants/interface"
import {
  Client,
  ComboboxOption,
  Employee,
  Technician,
} from "@/lib/constants/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"

interface UseStallChoicesOptions {
  excludeAssignedStall?: boolean
  assignedStallId?: number | string
}

const url = "choices/"

export const useItemChoices = () => {
  return useApiQuery<Item[]>({
    queryKey: ["item-choices"],
    url: `${url}items/`,
  })
}

export const useCategoryChoices = () => {
  return useApiQuery<ProductCategory[]>({
    queryKey: ["category-choices"],
    url: `${url}categories/`,
  })
}

export const useStallChoices = ({
  excludeAssignedStall,
  assignedStallId,
}: UseStallChoicesOptions) => {
  return useApiQuery<Stall[]>({
    queryKey: ["stall-choices", { excludeAssignedStall, assignedStallId }],
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
    queryKey: ["technician-choices"],
    url: `${url}technicians/`,
  })
}

interface UseEmployeeChoicesOptions {
  includeInPayroll?: boolean
}

export const useEmployeeChoices = (options?: UseEmployeeChoicesOptions) => {
  const params = new URLSearchParams()

  if (options?.includeInPayroll !== undefined) {
    params.append("include_in_payroll", options.includeInPayroll.toString())
  }

  const queryString = params.toString()
  return useApiQuery<Employee[]>({
    queryKey: ["employee-choices", options],
    url: `${url}employees/${queryString ? `?${queryString}` : ""}`,
  })
}

export const useClientChoices = () => {
  return useApiQuery<Client[]>({
    queryKey: ["client-choices"],
    url: `${url}clients/`,
  })
}

export const useUsersChoices = () => {
  return useApiQuery<User[]>({
    queryKey: ["users-choices"],
    url: `${url}users/`,
  })
}

export const useBanksChoices = () => {
  return useApiQuery<ComboboxOption[]>({
    queryKey: ["banks-choices"],
    url: `${url}banks/`,
  })
}

export const useAirconTypesChoices = () => {
  return useApiQuery<ComboboxOption[]>({
    queryKey: ["aircon-types-choices"],
    url: `${url}aircon-types/`,
  })
}

export const useHorsePowerChoices = () => {
  return useApiQuery<ComboboxOption[]>({
    queryKey: ["horsepower-choices"],
    url: `${url}horsepower/`,
  })
}

export const useAirconBrandsChoices = () => {
  return useApiQuery<AirconBrands[]>({
    queryKey: ["aircon-brands-choices"],
    url: `${url}aircon-brands/`,
  })
}

export const useAirconModelsChoices = () => {
  return useApiQuery<AirconModels[]>({
    queryKey: ["aircon-models-choices"],
    url: `${url}aircon-models/`,
  })
}

export const useExpenseCategoryChoices = () => {
  return useApiQuery<ExpenseCategory[]>({
    queryKey: ["expense-category-choices"],
    url: `${url}expense-categories/`,
  })
}

export const useApplianceTypeChoices = () => {
  return useApiQuery<ApplianceType[]>({
    queryKey: ["appliance-type-choices"],
    url: `${url}appliance-types/`,
  })
}

export const useChequeChoices = (clientId?: number) => {
  const params = new URLSearchParams()
  if (clientId) {
    params.append("client", clientId.toString())
  }
  params.append("status", "pending")
  params.append("status", "deposited")

  const queryString = params.toString()
  const { data, ...rest } = useApiQuery<
    {
      id: number
      cheque_number: string
      cheque_amount: string
      billing_amount: string
      client_name: string
    }[]
  >({
    queryKey: ["cheque-choices", clientId],
    url: `receivables/cheques/choices/${queryString ? `?${queryString}` : ""}`,
    options: {
      enabled: !!clientId,
    },
  })

  // Transform data to ComboboxOption format
  const transformedData: ComboboxOption[] = (data || []).map((cheque) => ({
    value: cheque.id,
    label: `${cheque.cheque_number} - ₱${parseFloat(cheque.billing_amount).toLocaleString()}`,
  }))

  return {
    data: transformedData,
    rawData: data || [],
    ...rest,
  }
}
