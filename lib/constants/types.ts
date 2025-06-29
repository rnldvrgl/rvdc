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

export type Province = {
  code: string
  legacyCode: string
  name: string
  incomeClassification: string
  population: number
  region: string
}

export type City = {
  code: string
  legacyCode: string
  name: string
  cityClass: string
  incomeClassification: string
  population: number
  region: string
}

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
