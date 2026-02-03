import type { PaginatedResult } from "@/lib/constants/types"
import type { ManualDeduction } from "@/lib/schemas/manualDeductionSchema"
import api from "@/lib/utils/api"
import { useQuery } from "@tanstack/react-query"

interface ManualDeductionsParams {
  page?: number
  page_size?: number
  deduction_type?: string
  is_active?: boolean
  employee?: number
  search?: string
}

export const useManualDeductions = (params: ManualDeductionsParams = {}) => {
  return useQuery<PaginatedResult<ManualDeduction>>({
    queryKey: ["manual-deductions", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()

      if (params.page) queryParams.append("page", params.page.toString())
      if (params.page_size)
        queryParams.append("page_size", params.page_size.toString())
      if (params.deduction_type)
        queryParams.append("deduction_type", params.deduction_type)
      if (params.is_active !== undefined)
        queryParams.append("is_active", params.is_active.toString())
      if (params.employee)
        queryParams.append("employee", params.employee.toString())
      if (params.search) queryParams.append("search", params.search)

      const response = await api.get(
        `/payroll/manual-deductions/?${queryParams.toString()}`,
      )
      return response.data
    },
  })
}

export const useManualDeduction = (id: number) => {
  return useQuery<ManualDeduction>({
    queryKey: ["manual-deduction", id],
    queryFn: async () => {
      const response = await api.get(`/payroll/manual-deductions/${id}/`)
      return response.data
    },
    enabled: !!id,
  })
}

export const useCompanyDeductions = () => {
  return useQuery<ManualDeduction[]>({
    queryKey: ["manual-deductions", "company-wide"],
    queryFn: async () => {
      const response = await api.get("/payroll/manual-deductions/company_wide/")
      return response.data
    },
  })
}

export const useEmployeeDeductions = (employeeId: number) => {
  return useQuery<ManualDeduction[]>({
    queryKey: ["manual-deductions", "employee", employeeId],
    queryFn: async () => {
      const response = await api.get(
        "/payroll/manual-deductions/for_employee/",
        {
          params: { employee_id: employeeId },
        },
      )
      return response.data
    },
    enabled: !!employeeId,
  })
}
