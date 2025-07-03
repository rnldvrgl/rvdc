export type UnitChoice = 'pcs' | 'ft' | 'kg' | 'roll' | 'box'

export interface GetColumnsProps<T> {
  onEdit: (item: T) => void
  onDelete: (item: T) => void
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

export interface NavListItem {
  name: string
  href?: string
  icon: React.ElementType
  action?: string
  children?: NavListItem[]
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
  is_active?: boolean
  contact_number?: string
}

// ---------------------
// Categories
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

// ---------------------
// Stock & StockRoom
// ---------------------
export interface Stock {
  id: number
  item: Item
  stall: Stall
  quantity: number
  low_stock_threshold: number
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface StockRoomStock {
  id: number
  item: Item
  quantity: number
  low_stock_threshold: number
  created_at: string
  updated_at: string
}

export interface StockPayload {
  item: number
  quantity: number
  cost_price: string
  sale_price: string
  expiry_date: string
}

// ---------------------
// Stock Transfer
// ---------------------
export interface StockTransfer {
  id: number
  from_stall: Stall | null
  to_stall: Stall
  technician: User | null
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

export interface StockTransferPayload {
  stock: number
  quantity: number
}
