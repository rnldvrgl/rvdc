export interface User {
  id: number
  first_name: string
  last_name: string
  username: string
  email: string
  profile_image: string
  birthday?: string
  is_active?: boolean
  contact_number?: string
}
export interface Client {
  id: number
  full_name: string
  contact_number: string
  address: string
  province: string
  city: string
  barangay: string
  is_deleted: boolean
}
