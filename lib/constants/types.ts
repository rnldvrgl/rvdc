import { loginSchema } from '@/lib/constants/schema'
import z from 'zod'

export type TSidebarRoute = {
  icon: any
  label: string
  path?: string
  routes?: { label: string; path: string }[]
}

export type LoginFormValues = z.infer<typeof loginSchema>

export interface ShopInfo {
  name: string
  description: string
  address?: string
  contactEmail?: string
}
