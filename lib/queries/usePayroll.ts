import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/utils/api'

/**
 * Types
 */
export type ID = number

export type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type TimeEntry = {
  id: ID
  employee: ID
  clock_in: string // ISO DateTime
  clock_out: string // ISO DateTime
  unpaid_break_minutes: number
  source: 'manual' | 'schedule' | 'import'
  approved: boolean
  notes?: string
  auto_closed: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  // Computed (server-side) helpers may be attached
  effective_hours?: number
  work_date?: string
}

export type AdditionalEarning = {
  id: ID
  employee: ID
  earning_date: string // ISO Date
  category: 'overtime' | 'installation_pct' | 'custom'
  amount: string | number
  description?: string
  reference?: string
  approved: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type WeeklyPayroll = {
  id: ID
  employee: ID
  week_start: string // ISO Date

  hourly_rate: string | number
  overtime_threshold: string | number
  overtime_multiplier: string | number

  regular_hours: string | number
  overtime_hours: string | number

  allowances: string | number
  additional_earnings_total: string | number
  gross_pay: string | number

  deductions: Record<string, string | number>
  total_deductions: string | number

  net_pay: string | number
  status: 'draft' | 'approved' | 'paid'
  notes?: string

  is_deleted: boolean
  created_at: string
  updated_at: string
}

type QueryParams = Record<string, string | number | boolean | undefined>

/**
 * Helpers
 */
const toQS = (params?: QueryParams) => {
  if (!params) return ''
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) p.append(k, String(v))
  })
  const s = p.toString()
  return s ? `?${s}` : ''
}

/**
 * Endpoints
 */
const PAYROLL_BASE = '/payroll'
const TIME_ENTRIES = `${PAYROLL_BASE}/time-entries/`
const TIME_ENTRIES_BULK = `${PAYROLL_BASE}/time-entries/bulk/`

const ADDITIONAL_EARNINGS = `${PAYROLL_BASE}/additional-earnings/`

const WEEKLY_PAYROLLS = `${PAYROLL_BASE}/weekly-payrolls/`
const weeklyPayrollDetail = (id: ID) => `${WEEKLY_PAYROLLS}${id}/`
const weeklyPayrollRecompute = (id: ID) =>
  `${WEEKLY_PAYROLLS}${id}/recompute/`

/**
 * Time Entries Queries and Mutations
 */

// List time entries
export const useTimeEntries = (params?: QueryParams) => {
  const qs = toQS(params)
  return useQuery({
    queryKey: ['payroll', 'time-entries', params],
    queryFn: async (): Promise<PaginatedResponse<TimeEntry>> => {
      const { data } = await api.get(TIME_ENTRIES + qs)
      return data
    },
    enabled: true,
  })
}

// Retrieve single time entry
export const useTimeEntry = (id?: ID) => {
  return useQuery({
    queryKey: ['payroll', 'time-entry', id],
    queryFn: async (): Promise<TimeEntry> => {
      const { data } = await api.get(`${TIME_ENTRIES}${id}/`)
      return data
    },
    enabled: !!id,
  })
}

// Create time entry
export const useCreateTimeEntry = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<TimeEntry>) => {
      const { data } = await api.post(TIME_ENTRIES, payload)
      return data as TimeEntry
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'time-entries'] })
    },
  })
}

// Update time entry
export const useUpdateTimeEntry = (id: ID) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<TimeEntry>) => {
      const { data } = await api.patch(`${TIME_ENTRIES}${id}/`, payload)
      return data as TimeEntry
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'time-entries'] })
      qc.invalidateQueries({ queryKey: ['payroll', 'time-entry', id] })
    },
  })
}

// Delete time entry (soft delete handled server-side if applicable)
export const useDeleteTimeEntry = (id: ID) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.delete(`${TIME_ENTRIES}${id}/`)
      return true
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'time-entries'] })
      qc.invalidateQueries({ queryKey: ['payroll', 'time-entry', id] })
    },
  })
}

// Bulk create time entries
export const useBulkCreateTimeEntries = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Array<Partial<TimeEntry>>) => {
      const { data } = await api.post(TIME_ENTRIES_BULK, payload)
      return data as { created: number; ids?: ID[] }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'time-entries'] })
    },
  })
}

/**
 * Additional Earnings Queries and Mutations
 */

// List additional earnings
export const useAdditionalEarnings = (params?: QueryParams) => {
  const qs = toQS(params)
  return useQuery({
    queryKey: ['payroll', 'additional-earnings', params],
    queryFn: async (): Promise<PaginatedResponse<AdditionalEarning>> => {
      const { data } = await api.get(ADDITIONAL_EARNINGS + qs)
      return data
    },
    enabled: true,
  })
}

// Retrieve single additional earning
export const useAdditionalEarning = (id?: ID) => {
  return useQuery({
    queryKey: ['payroll', 'additional-earning', id],
    queryFn: async (): Promise<AdditionalEarning> => {
      const { data } = await api.get(`${ADDITIONAL_EARNINGS}${id}/`)
      return data
    },
    enabled: !!id,
  })
}

// Create additional earning
export const useCreateAdditionalEarning = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<AdditionalEarning>) => {
      const { data } = await api.post(ADDITIONAL_EARNINGS, payload)
      return data as AdditionalEarning
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'additional-earnings'] })
    },
  })
}

// Update additional earning
export const useUpdateAdditionalEarning = (id: ID) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<AdditionalEarning>) => {
      const { data } = await api.patch(`${ADDITIONAL_EARNINGS}${id}/`, payload)
      return data as AdditionalEarning
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'additional-earnings'] })
      qc.invalidateQueries({ queryKey: ['payroll', 'additional-earning', id] })
    },
  })
}

// Delete additional earning
export const useDeleteAdditionalEarning = (id: ID) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.delete(`${ADDITIONAL_EARNINGS}${id}/`)
      return true
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'additional-earnings'] })
      qc.invalidateQueries({
        queryKey: ['payroll', 'additional-earning', id],
      })
    },
  })
}

/**
 * Weekly Payroll Queries and Mutations
 */

// List weekly payrolls
export const useWeeklyPayrolls = (params?: QueryParams) => {
  const qs = toQS(params)
  return useQuery({
    queryKey: ['payroll', 'weekly-payrolls', params],
    queryFn: async (): Promise<PaginatedResponse<WeeklyPayroll>> => {
      const { data } = await api.get(WEEKLY_PAYROLLS + qs)
      return data
    },
    enabled: true,
  })
}

// Retrieve single weekly payroll
export const useWeeklyPayroll = (id?: ID) => {
  return useQuery({
    queryKey: ['payroll', 'weekly-payroll', id],
    queryFn: async (): Promise<WeeklyPayroll> => {
      const { data } = await api.get(weeklyPayrollDetail(id as ID))
      return data
    },
    enabled: !!id,
  })
}

// Create weekly payroll
export const useCreateWeeklyPayroll = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<WeeklyPayroll>) => {
      const { data } = await api.post(WEEKLY_PAYROLLS, payload)
      return data as WeeklyPayroll
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'weekly-payrolls'] })
    },
  })
}

// Update weekly payroll
export const useUpdateWeeklyPayroll = (id: ID) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<WeeklyPayroll>) => {
      const { data } = await api.patch(weeklyPayrollDetail(id), payload)
      return data as WeeklyPayroll
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'weekly-payrolls'] })
      qc.invalidateQueries({ queryKey: ['payroll', 'weekly-payroll', id] })
    },
  })
}

// Delete weekly payroll
export const useDeleteWeeklyPayroll = (id: ID) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.delete(weeklyPayrollDetail(id))
      return true
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'weekly-payrolls'] })
      qc.invalidateQueries({ queryKey: ['payroll', 'weekly-payroll', id] })
    },
  })
}

/**
 * Recompute Weekly Payroll Mutation
 */
export const useRecomputeWeeklyPayroll = (id: ID) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload?: {
      include_unapproved?: boolean
      allowances?: number
      extra_flat_deductions?: Record<string, number>
      percent_deductions?: Record<string, number>
    }) => {
      // POST to recompute endpoint
      const { data } = await api.post(weeklyPayrollRecompute(id), payload ?? {})
      return data as WeeklyPayroll
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll', 'weekly-payrolls'] })
      qc.invalidateQueries({ queryKey: ['payroll', 'weekly-payroll', id] })
    },
  })
}
