export type Sorting = { id: string; desc: boolean }[]

export type TBarangay = {
  code: string
  legacyCode: string
  name: string
  isUrban: boolean
  isRural: boolean
  population: number
  region: string
  city: string
}

export type TClient = {
  id: number
  full_name: string
  contact_number: string
  address: string
  province: string
  city: string
  barangay: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type TPaginatedClients = {
  count: number
  next: string | null
  previous: string | null
  results: TClient[]
}
