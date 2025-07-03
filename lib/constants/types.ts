// Shared utility types
export type Sorting = { id: string; desc: boolean }[]

export type PaginatedFilterProps = {
  page?: number
  limit?: number
  search?: string
  ordering?: string
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
  id?: number
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
