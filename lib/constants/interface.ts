import { Client, Roles, UnitChoice } from '@/lib/constants/types'
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
  onView?: (item: T) => void
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

export interface EntityState<T> {
  open: boolean
  entity: T | undefined
}

export interface useEntitySheetReturn<T> {
  entityState: EntityState<T>
  openEntity: (entity?: T) => void
  closeEntity: () => void
  toggleEntity: () => void
  confirmClose?: () => void
}

export interface EntityDialogProps<T> {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  entity?: T
  renderForm: (props: { onClose: () => void; entity?: T }) => React.ReactNode
}

export interface EntityDialogState<T> {
  open: boolean
  entity: T | undefined
}

export interface useEntitySheetReturn<T> {
  entityState: EntityDialogState<T>
  openEntity: (entity?: T) => void
  closeEntity: () => void
  toggleEntity: () => void
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
export interface ItemEntry {
  item: Item
  quantity: number
  final_price_per_unit?: number
}

export interface Item {
  id: number
  name: string
  sku: string
  category: ProductCategory | null
  description?: string | null
  unit_of_measure: UnitChoice
  retail_price: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  display_name?: string
}

export interface ItemPayload {
  name: string
  retail_price: number
  category_id: number | null
  description?: string
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
  stock_room_quantity: number
  stock_room_status: string
}

export interface StockPayload {
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
  low_stock_threshold: number
  status: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface StockRoomStockPayload {
  quantity: number
  low_stock_threshold?: number
}

// ---------------------
// Stock Transfer
// ---------------------
export interface StockTransferItem {
  id: number
  transfer: number
  item: Item
  quantity: number
}

export interface StockTransfer {
  id: number
  from_stall: Stall | null
  to_stall: Stall
  transferred_by: User | null
  technician: User | null
  transfer_date: string
  is_finalized: boolean
  finalized_at: string | null
  items: StockTransferItem[]
  is_paid: boolean
  paid_at: string | null
  total_price: string | number
  used_for: string
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
  role: 'admin' | 'manager' | 'clerk' | string
  permissions: string[]
}

export interface Notification {
  id: number
  user: User
  type: string
  data: any
  message: string
  is_read: boolean
  created_at: string
  relative_time: string
  summary: string
}

export interface Expense {
  id: number
  stall: { id: number; name: string }
  total_price: number
  paid_amount: number
  is_paid: boolean
  description: string
  source: 'manual' | 'transfer'
  created_by: { id: number; name: string }
  created_at: string
  paid_at?: string
  transfer?: StockTransfer
}

// Payment enums
export type PaymentType = 'cash' | 'gcash' | 'credit' | 'debit' | 'cheque'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

// Payment
export interface SalesPayment {
  id: number
  payment_type: PaymentType
  amount: number
  payment_date: string
}

// Sales Item
export interface SalesItem {
  id: number
  item: Item
  description: string
  quantity: number
  final_price_per_unit: string
  line_total: string
}

// Sales Transaction
export interface SalesTransaction {
  id: number
  stall: Stall
  client?: Client

  manual_receipt_number?: string | null
  system_receipt_number: string // UUID

  payment_status: PaymentStatus

  voided: boolean
  voided_at?: string | null
  void_reason?: string | null

  is_deleted: boolean
  deleted_at?: string | null

  created_at: string
  updated_at: string

  // Related items & payments
  items: SalesItem[]
  payments: SalesPayment[]

  // Computed props if you send them from serializer
  computed_total?: string
  total_items?: number
  total_paid?: string
}
