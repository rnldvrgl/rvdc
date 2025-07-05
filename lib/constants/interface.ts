import { Roles, UnitChoice } from '@/lib/constants/types'
import { LucideIcon } from 'lucide-react'

// ---------------------
// API Mutations & Sheets
// ---------------------
export interface UseApiMutationProps<TFn extends (...args: any[]) => any> {
  mutationFn: TFn
  successMessage?: string
  invalidateQueries?: { queryKey: string[] }[]
  onSuccess?: (
    data: Awaited<ReturnType<TFn>>,
    variables: Parameters<TFn>[0],
  ) => void
  onError?: (error: any) => void
}

export interface GetColumnsProps<T> {
  onEdit: (item: T) => void
  onDelete: (item: T) => void
  onRestock?: (item: T) => void
  role?: Roles
}

export interface EntitySheetProps<T> {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  entity?: T
  renderForm: (props: { onClose: () => void; entity?: T }) => React.ReactNode
}

export interface EntitySheetState<T> {
  open: boolean
  entity: T | undefined
}

export interface UseEntitySheetReturn<T> {
  sheetState: EntitySheetState<T>
  openSheet: (entity?: T) => void
  closeSheet: () => void
  toggleSheet: () => void
}

// ---------------------
// User
// ---------------------
export interface User {
  id: number
  first_name: string
  last_name: string
  username: string
  email: string
  profile_image: string
  birthday?: string
  assigned_stall?: Stall
  is_active?: boolean
  contact_number?: string
  role: Roles
}

// ---------------------
// Product Categories
// ---------------------
export interface ProductCategory {
  id: number
  name: string
  description?: string
  is_deleted?: boolean
  created_at: string
  updated_at: string
}

export interface ProductCategoryPayload {
  name: string
  description?: string
}

// ---------------------
// Item
// ---------------------
export interface Item {
  id: number
  name: string
  sku: string
  category: ProductCategory | null
  description?: string | null
  size_or_spec?: string | null
  unit_of_measure: UnitChoice
  srp: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  display_name?: string
}

export interface ItemPayload {
  name: string
  srp: number
  category_id: number | null
  description?: string
  size_or_spec?: string
  unit_of_measure: UnitChoice
}

// ---------------------
// Stall
// ---------------------
export interface Stall {
  id: number
  name: string
  location: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface StallPayload {
  name: string
  location: string
}

// ---------------------
// Stock (Stall Stocks)
// ---------------------
export interface Stock {
  id: number
  item: Item
  stall: Stall | null
  quantity: number
  low_stock_threshold: number
  status: string
  type_display: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface StockPayload {
  item_id: number
  stall_id?: number | null
  quantity: number
  low_stock_threshold?: number
}

// ---------------------
// StockRoom Stock
// ---------------------
export interface StockRoomStock {
  id: number
  item: Item
  quantity: number
  cost_price?: string
  expiry_date?: string
  low_stock_threshold: number
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface StockRoomStockPayload {
  item_id: number
  quantity: number
  cost_price?: string
  expiry_date?: string
  low_stock_threshold?: number
}

// ---------------------
// Stock Transfer
// ---------------------
export interface StockTransfer {
  id: number
  from_stall: Stall | null
  to_stall: Stall
  transferred_by: User | null
  transfer_date: string
  items: StockTransferItem[]
}

export interface StockTransferItem {
  id: number
  transfer: number
  item: Item
  quantity: number
}

/**
 * This payload is for creating a transfer.
 * You can either transfer:
 * - from stock room stock (via from_stock_room_stock)
 * - or from another stall (via from_stall)
 */
export interface StockTransferPayload {
  from_stock_room_stock?: number
  from_stall?: number
  to_stall: number
  item: number
  quantity: number
}

// ---------------------
// Navigation
// ---------------------
export interface NavigationItemBase {
  name: string
  icon: LucideIcon
  permission?: string
}

export interface ShortcutLink extends NavigationItemBase {
  action: string
}

export interface NavigationLink extends NavigationItemBase {
  href: string
}

export interface NavigationGroup extends NavigationItemBase {
  children: NavigationLink[]
}

export interface BuildNavOptions {
  role: 'admin' | 'manager' | string
  permissions: string[]
}
