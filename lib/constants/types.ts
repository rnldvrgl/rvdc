import { DATE_RANGE_PRESETS } from '@/lib/constants/general'
import {
  NavigationGroup,
  NavigationLink,
  ShortcutLink,
} from '@/lib/constants/interface'
import { userProfileSchema } from '@/lib/constants/schema'
import { LucideIcon } from 'lucide-react'
import z from 'zod'

// Shared utility types
export type Sorting = { id: string; desc: boolean }[]
export type UnitChoice = 'pcs' | 'ft' | 'kg' | 'roll' | 'box'
export type Roles = 'admin' | 'manager' | 'clerk' | 'guest'
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
  contact_number: string
  address: string
  province: string
  city: string
  barangay: string
}

export type ClientPayload = Omit<Client, keyof BaseEntity>

// Technician
export type Technician = BaseEntity & {
  role?: string
  is_active?: boolean
  email?: string
  birthday?: string
  first_name: string
  last_name: string
  contact_number: string
  address: string
  province: string
  city: string
  barangay: string
  sss_number?: string
  tin_number?: string
  philhealth_number?: string
  basic_salary?: number
  profile_image?: string
}

// Navigation

export type NavItem = {
  name: string
  href?: string
  icon: LucideIcon
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

export type UserProfilePayload = Omit<TUserProfile, 'birthday'> & {
  birthday?: string
}

export type DateRangePresetLabel = (typeof DATE_RANGE_PRESETS)[number]['label']
