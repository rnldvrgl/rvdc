import { DATE_RANGE_PRESETS } from "@/lib/constants/general"
import {
  NavigationGroup,
  NavigationLink,
  ShortcutLink,
  Stall,
} from "@/lib/constants/interface"
import {
  ChequeCollectionSchema,
  userProfileSchema,
} from "@/lib/constants/schema"
import { RemixiconComponentType } from "@remixicon/react"
import { LucideIcon } from "lucide-react"
import z from "zod"

// Shared utility types
export type Sorting = { id: string; desc: boolean }[]
export type UnitChoice = "pcs" | "ft" | "kg" | "roll" | "box"
export type Roles = "admin" | "manager" | "clerk" | "technician" | "guest"
export type NavigationEntry = NavigationLink | NavigationGroup
export type ShortcutEntry = ShortcutLink

export type ShopInfo = {
  name: string
  description: string
  address: string
  contactEmail: string
}

export type PaginatedFilterProps = {
  page?: number
  limit?: number
  search?: string
  ordering?: string
  start_date?: string
  end_date?: string
  filter?: Record<string, unknown>
}

// Generic paginated response
export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Authentication
export type LoginFormValues = {
  username: string
  password: string
  remember_me?: boolean
}

// Location
export type Barangay = {
  code: string
  legacyCode: string
  name: string
  isUrban: boolean
  isRural: boolean
  population: number
  region: string
  city: string
}

export type City = {
  code: string
  legacyCode: string
  name: string
  isUrban: boolean
  isRural: boolean
  population: number
  region: string
  province: string
}

export type Province = {
  code: string
  legacyCode: string
  name: string
  isUrban: boolean
  isRural: boolean
  population: number
  region: string
}

// Common entity fields
export type BaseEntity = {
  id: number
  is_deleted?: boolean
  created_at?: string
  updated_at?: string
}

// Client
export type Client = BaseEntity & {
  full_name: string
  contact_number?: string | null
  address?: string | null
  province: string
  city: string
  barangay?: string | null
  is_blocklisted: boolean
}

export type ClientPayload = Omit<Client, keyof BaseEntity>

// Employee (formerly Technician)
export type Employee = BaseEntity & {
  username?: string
  role: "admin" | "manager" | "clerk" | "technician"
  is_active?: boolean
  email?: string
  birthday?: string
  first_name: string
  last_name: string
  full_name: string
  contact_number: string
  address: string
  province: string
  city: string
  barangay: string
  sss_number?: string
  tin_number?: string
  philhealth_number?: string
  basic_salary?: number
  include_in_payroll?: boolean
  has_sss?: boolean
  has_philhealth?: boolean
  has_pagibig?: boolean
  has_bir_tax?: boolean
  profile_image?: string
  assigned_stall?: Stall
}

// Keep Technician as alias for backward compatibility
export type Technician = Employee

// Navigation

export type NavItem = {
  name: string
  href?: string
  icon: LucideIcon | RemixiconComponentType
  action?: string
  children?: NavItem[]
}

export type NavListItem = {
  items: NavItem[]
  activePath: string
  close?: () => void
  onAction?: (action: string) => void
  title?: string
  level?: number
  href?: string
  children?: NavListItem[]
}

export type CursorPaginatedResponse<TItem> = {
  results: TItem[]
  next: string | null
  previous: string | null
}

export type TUserProfile = z.infer<typeof userProfileSchema>

export type UserProfilePayload = Omit<TUserProfile, "birthday"> & {
  birthday?: string
}

export type DateRangePresetLabel = (typeof DATE_RANGE_PRESETS)[number]["label"]

export type SortState = {
  id: string
  desc: boolean
}

export type ChequeCollectionPayload = z.infer<typeof ChequeCollectionSchema>

export type ComboboxOption = {
  value: string | number
  label: string
}

export type TimeEntry = {
  id: number
  employee: number

  clock_in: string // ISO DateTime
  clock_out: string // ISO DateTime

  unpaid_break_minutes: number

  source: "manual" | "schedule" | "import"

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
  id: number
  employee: number

  earning_date: string // ISO Date

  category: "overtime" | "installation_pct" | "custom"

  amount: string | number

  description?: string

  reference?: string

  approved: boolean

  is_deleted: boolean

  created_at: string
  updated_at: string
}

export type WeeklyPayroll = {
  id: number
  employee: number

  employee_name?: string
  employee_role?: string
  employee_detail?: {
    id: number
    username: string
    first_name: string
    last_name: string
    full_name: string
    role: string
    daily_rate: string | number
    hourly_rate: string | number
  }

  week_start: string // ISO Date
  week_end?: string // ISO Date

  hourly_rate: string | number

  overtime_threshold: string | number
  overtime_multiplier: string | number

  regular_hours: string | number
  night_diff_hours: string | number
  approved_ot_hours: string | number

  allowances: string | number

  additional_earnings_total: string | number

  gross_pay: string | number

  night_diff_pay: string | number
  approved_ot_pay: string | number

  holiday_pay_regular?: string | number
  holiday_pay_special?: string | number
  holiday_pay_total?: string | number

  deductions: Record<string, string | number>
  deduction_metadata: Record<
    string,
    {
      source_type?: string
      source_id?: number
      category?: string
    }
  >
  total_deductions: string | number

  net_pay: string | number

  status: "draft" | "approved" | "paid" | "received" | "cancelled"
  status_display?: string

  received_at?: string | null
  received_by?: number | null
  received_by_detail?: {
    id: number
    username: string
    first_name: string
    last_name: string
    full_name: string
  }

  disputed: boolean
  disputed_reason?: string
  disputed_at?: string | null

  notes?: string

  is_deleted: boolean

  created_at: string
  updated_at: string
}

export type PayrollStatus =
  | "draft"
  | "approved"
  | "paid"
  | "received"
  | "cancelled"

export type HolidayKind = "regular" | "special_non_working"

// Attendance System Types
export type AttendanceType =
  | "FULL_DAY"
  | "HALF_DAY"
  | "PARTIAL"
  | "ABSENT"
  | "LEAVE"
  | "PENDING"
  | "INVALID"
export type AttendanceStatus = "PENDING" | "APPROVED" | "REJECTED" | "NONE"
export type LeaveType = "SICK" | "EMERGENCY"
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
export type ShiftPeriod = "AM" | "PM" | "FULL"
export type CalendarAttendanceStatus = "present" | "late" | "absent" | "leave"

export type AttendanceRecord = BaseEntity & {
  employee: number
  employee_name: string
  date: string
  clock_in: string | null
  clock_out: string | null
  attendance_type: AttendanceType
  attendance_type_display: string
  consecutive_absences: number
  is_awol: boolean
  total_hours: string
  break_hours: string
  paid_hours: string
  is_late: boolean
  late_minutes: number
  auto_closed: boolean
  auto_close_warning_count: number
  late_penalty_amount: string
  missing_uniform_shirt: boolean
  missing_uniform_pants: boolean
  missing_uniform_shoes: boolean
  uniform_penalty_amount: string
  status: AttendanceStatus
  status_display: string
  approved_by: number | null
  approved_by_name: string | null
  approved_at: string | null
  notes: string
}

export type DailyAttendance = AttendanceRecord & {
  is_suspended: boolean
  suspension_info: SuspensionInfo | null
}

export type CurrentAttendanceStatus = {
  attendance: DailyAttendance | null
  is_suspended: boolean
  suspension_info: SuspensionInfo | null
}

export type ClockInPayload = {
  employee_id: number
  date: string
  clock_in: string
  notes?: string
}

export type ClockOutPayload = {
  attendance_id: number
  clock_out: string
  notes?: string
}

export type ApproveAttendancePayload = {
  attendance_ids: number[]
}

export type RejectAttendancePayload = {
  attendance_ids: number[]
  reason?: string
}

export type UpdateUniformPenaltiesPayload = {
  missing_uniform_shirt: boolean
  missing_uniform_pants: boolean
  missing_uniform_shoes: boolean
}

export type LeaveBalance = BaseEntity & {
  employee: number
  employee_name: string
  year: number
  sick_leave_total: number
  sick_leave_used: string
  sick_leave_remaining: string
  emergency_leave_total: number
  emergency_leave_used: string
  emergency_leave_remaining: string
}

export type LeaveRequest = BaseEntity & {
  employee: number
  employee_name: string
  leave_type: LeaveType
  leave_type_display: string
  date: string
  is_half_day: boolean
  shift_period: ShiftPeriod
  shift_period_display: string
  days_count: string
  reason: string
  status: LeaveStatus
  status_display: string
  approved_by: number | null
  approved_by_name: string | null
  approved_at: string | null
  rejection_reason: string
}

export type LeaveRequestPayload = {
  employee?: number // Optional for admin/manager, auto-set for others
  leave_type: LeaveType
  date: string
  is_half_day: boolean
  shift_period: ShiftPeriod
  reason: string
}

export type ApproveLeavePayload = {
  leave_request_ids: number[]
}

export type RejectLeavePayload = {
  leave_request_ids: number[]
  reason?: string
}

// Offense types
export type OffenseType = "AWOL" | "LATE" | "CURFEW" | "OTHER"
export type SeverityLevel = "WARNING" | "SUSPENSION" | "TERMINATION"

export type Offense = BaseEntity & {
  employee: number
  employee_name: string
  employee_id_number: string
  offense_type: OffenseType
  offense_type_display: string
  severity_level: SeverityLevel
  severity_level_display: string
  date: string
  description: string
  penalty_days: number
  suspension_start_date: string | null
  suspension_end_date: string | null
  created_by: number | null
  created_by_name: string | null
  notes: string
  offense_count: number
}

export type OffensePayload = {
  employee: number
  offense_type: OffenseType
  severity_level?: SeverityLevel // Optional: auto-calculated by backend
  date: string
  description: string
  penalty_days?: number
  suspension_start_date?: string | null
  notes?: string
}

export type OffenseStatistics = {
  employee_id: number
  employee_name: string
  employee_id_number: string
  total_offenses: number
  awol_count: number
  late_count: number
  curfew_count: number
  other_count: number
  warning_count: number
  suspension_count: number
  termination_count: number
  is_at_limit: boolean
  last_offense_date: string | null
}

export type SuspensionInfo = {
  is_suspended: boolean
  suspension_start_date: string | null
  suspension_end_date: string | null
  offense_type: OffenseType | null
}
