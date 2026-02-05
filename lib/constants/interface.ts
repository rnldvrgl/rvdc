import { AirconTypes, ChequeStatus } from "@/lib/constants/general"
import {
  Client,
  ComboboxOption,
  Roles,
  UnitChoice,
} from "@/lib/constants/types"
import { RemixiconComponentType } from "@remixicon/react"
import { LucideIcon } from "lucide-react"

// ---------------------
// API Mutations & Sheets
// ---------------------
export interface UseApiMutationProps<TVariables, TData> {
  mutationFn: (variables: TVariables) => Promise<TData>
  successMessage?: string
  invalidateQueries?: { queryKey: string[] }[]
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: unknown) => void
  // Toast.promise configuration
  usePromiseToast?: boolean // Enable toast.promise instead of toast.success/error
  loadingMessage?: string // Message shown during loading
  errorMessage?: string // Custom error message (overrides DRF error handling)
}

export interface GetColumnsProps<T> {
  onEdit: (item: T) => void
  onDelete: (item: T) => void
  onRestock?: (item: T) => void
  onCustomAction?: (item: T) => void
  onView?: (item: T) => void
  onPrint?: (item: T) => void
  onAddStock?: (item: T) => void

  // Status actions
  onSold?: (item: T) => void
  onInstall?: (item: T) => void
  onReserve?: (item: T) => void
  onRedeemCleaning?: (item: T) => void
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
  full_name?: string
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
  print_price_per_unit?: number
}

export interface Item {
  id: number
  name: string
  sku: string
  category: ProductCategory | null
  description?: string | null
  unit_of_measure: UnitChoice
  retail_price: string
  wholesale_price: string
  technician_price: string
  cost_price: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  display_name?: string
}

export interface ItemPayload {
  name: string
  retail_price: number
  wholesale_price: number
  technician_price: number
  cost_price: number
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
  track_stock: boolean
  stock_room_quantity: number
  stock_room_status: string
  min_threshold?: number
  max_threshold?: number
}

export interface StockPayload {
  stall_id?: number | null
  quantity: number
  low_stock_threshold?: number
  track_stock?: boolean
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
// Navigation
// ---------------------
export interface NavigationItemBase {
  name: string
  icon: LucideIcon | RemixiconComponentType
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
  role: "admin" | "manager" | "clerk" | string
  permissions: string[]
}

export interface Notification {
  id: number
  user: User
  type: string
  data: Record<string, unknown>
  message: string
  is_read: boolean
  created_at: string
  relative_time: string
  summary: string
}

// Expense Category
export interface ExpenseCategory {
  id: number
  name: string
  description: string
  monthly_budget: number
  is_active: boolean
  is_deleted: boolean
  parent?: number
  parent_name?: string
  parent_data?: ExpenseCategory
  subcategories?: ExpenseCategory[]
  created_at: string
  updated_at: string
}

export interface ExpenseCategoryPayload {
  name: string
  description?: string
  monthly_budget?: number
  is_active?: boolean
  parent?: number
}

// Expense Item
export interface ExpenseItem {
  id: number
  expense: number
  item?: number
  item_data?: Item
  description: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  updated_at: string
}

// Expense
export interface Expense {
  id: number
  stall: number | string
  stall_data: Stall
  category?: number
  category_data?: ExpenseCategory
  total_price: number
  paid_amount: number
  is_paid: boolean
  payment_status: "unpaid" | "partial" | "paid"
  payment_method?: string
  description: string
  expense_date: string
  reference_number?: string
  vendor?: string
  source: "manual" | "service"
  is_deleted: boolean
  deleted_at?: string
  created_by: { id: number; name: string }
  created_at: string
  updated_at?: string
  paid_at?: string
  items?: ExpenseItem[]
}

export interface ExpensePayload {
  stall?: number
  category?: number
  total_price: number
  description: string
  expense_date?: string
  reference_number?: string
  vendor?: string
  payment_status?: "unpaid" | "partial" | "paid"
  payment_method?: string
  paid_amount?: number
}

// Payment enums
export type PaymentType = "cash" | "gcash" | "credit" | "debit" | "cheque"
export type PaymentStatus = "unpaid" | "partial" | "paid"

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
  print_price_per_unit?: string | number
  line_total: number
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
  total_paid?: number
}

export interface SalesTransactionPayload {
  stall: number | null | undefined
  client: number | null
  manual_receipt_number: string | null
  items: {
    item: number
    quantity: number
    final_price_per_unit: number
  }[]
  payments: {
    payment_type: string
    amount: number
  }[]
}

export interface SalesTransactionVoidingPayload {
  void_reason: string
}

export interface AnalyticsSummary {
  // Revenue metrics
  total_sales: number // sales revenue only
  service_revenue: number // service revenue
  total_revenue: number // combined sales + services
  net_income: number // revenue - expenses

  // Outstanding balances
  total_outstanding: number // total receivables
  sales_outstanding: number // sales receivables
  services_outstanding: number // services receivables

  // Service performance
  total_services: number // total services in period
  active_services: number // pending/in-progress services
  completed_services: number // completed services
  service_completion_rate: number // completion percentage

  // Schedule metrics
  today_schedules: number // schedules today
  pending_schedules: number // pending schedules today

  // Client metrics
  total_clients: number // total clients
  new_clients: number // new clients in period

  // Inventory
  low_stock_items: number // low stock count
  no_stock_items: number // out of stock count
  inventory_alerts: number // combined alerts

  // Expenses
  total_expense: number // total expenses

  // Top selling
  top_selling_item: {
    name: string | null // name of the top selling item (nullable)
    quantity: number // quantity sold
  }
}

export type TopSellingItems = {
  item: string
  quantity: number
}

export interface SalesOvertime {
  date: string
  total_sales: number
}

export interface ExpensesOvertime {
  date: string
  total_expense: number
}

export type CashFlow = {
  date: string
  income: number
  expense: number
}

export type TopClients = {
  client: string
  total_spent: number
}

export type UnpaidSalesStatus = {
  status: string
  count: number
}

export type RestocksOvertime = {
  date: string
  restock_volume: number
}
export interface LabeledOption {
  label: string
  value: string
}

export interface FilterDefinition {
  key: string
  label: string
  options: LabeledOption[]
}

export interface SortOption {
  label: string
  value: string
}

export interface FilterResponse {
  filters: Record<string, LabeledOption[]>
  ordering: LabeledOption[]
}

export interface CashDenominationBreakdown {
  total_remitted_amount: string
  total_declared_amount: string
  cod_amount: string
  total_cash_declared: string

  count_1000: number
  count_500: number
  count_200: number
  count_100: number
  count_50: number
  count_20: number
  count_10: number
  count_5: number
  count_1: number

  declared_count_1000: number
  declared_count_500: number
  declared_count_200: number
  declared_count_100: number
  declared_count_50: number
  declared_count_20: number
  declared_count_10: number
  declared_count_5: number
  declared_count_1: number
}

export interface RemittanceRecord {
  id: number
  stall: number
  stall_data?: {
    id: number
    name: string
  }

  created_at: string

  total_sales_cash: string
  total_sales_gcash: string
  total_sales_credit: string
  total_sales_debit: string
  total_sales_cheque: string

  total_collected: string
  total_expenses: string
  expected_remittance: string
  declared_amount: string
  remitted_amount: string
  balance: string

  is_remitted: boolean
  notes: string

  remitted_by: {
    id: number
    full_name: string
  } | null

  cash_breakdown?: CashDenominationBreakdown

  cod_for_next_day: number | string
  cod_for_today: {
    cod_amount: number | string
    cod_breakdown: unknown | null
    source: string
    date: string
  }
}

export interface ChequeCollection {
  id: number
  date_collected: string
  client: number
  client_name: string
  issued_by: string
  billing_amount: string
  cheque_amount: string
  cheque_number: string
  cheque_date: string
  bank_name: string
  deposit_bank?: string
  or_number?: string
  sales_transaction?: number | null
  collection_type: string
  collected_by?: number
  collected_by_name?: string
  notes?: string
  status: ChequeStatus
  created_at: string
  updated_at: string
}

export interface ChequeCollectionRequest {
  client: number
  collected_by?: number
  issued_by: string
  billing_amount: string
  cheque_amount: string
  cheque_number: string
  cheque_date: string
  bank_name: string
  deposit_bank?: string
  or_number?: string
  collection_type: string
  notes?: string
}

export interface ComboBoxProps {
  options: ComboboxOption[]
  value: string | number | null
  onChange: (value: string | number | null) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

export interface AirconType {
  id: number
  name: string
}

export interface AirconBrands {
  id: number
  name: string
}

export interface AirconModels {
  id: number
  brand?: AirconBrands
  brand_id?: number
  name: string
  retail_price: string
  discount_percentage?: string
  aircon_type: AirconTypes
  is_inverter: boolean
  has_discount?: boolean
}

// Response type
export interface AirconUnits {
  id: number
  model: AirconModels
  serial_number: string
  outdoor_serial_number?: string | null
  sale?: number | null
  installation?: number | null
  reserved_by?: Client | null
  reserved_at?: string | null
  warranty_start_date?: string | null
  warranty_period_months?: number
  free_cleaning_redeemed?: boolean
  warranty_end_date?: string
  warranty_status?: string
  warranty_days_left?: number
  is_reserved?: boolean
  is_available_for_sale?: boolean
  created_at?: string
}

// Request type
export type AirconUnitPayload = {
  serial_number: string
  outdoor_serial_number?: string
  model_id: number
  sale?: number | null
  installation?: number | null
  reserved_by?: number | null
  free_cleaning_redeemed?: boolean
}

// ---------------------
// Services & Installations
// ---------------------
export type ServiceType =
  | "repair"
  | "inspection"
  | "cleaning"
  | "motor_rewind"
  | "installation"
export type ServiceMode = "carry_in" | "home_service" | "pull_out"
export type ServiceStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled"
export type ApplianceStatus =
  | "received"
  | "diagnosed"
  | "in_repair"
  | "completed"
  | "ready_for_pickup"
  | "delivered"
export type AssignmentType = "repair" | "pickup" | "delivery" | "inspect"

// Appliance Type
export interface ApplianceType {
  id: number
  name: string
}

// Service Appliance
export interface ServiceAppliance {
  id: number
  service: number
  appliance_type: ApplianceType | null
  brand?: string
  model?: string
  issue_reported?: string
  diagnosis_notes?: string
  status: ApplianceStatus
  assigned_technician?: number | null
  assigned_technician_name?: string
  labor_fee: string
  labor_is_free: boolean
  labor_original_amount?: string
  labor_discount_amount?: string
  labor_discount_percentage?: string
  labor_discount_reason?: string
  discounted_labor_fee?: string
  items_used?: ApplianceItemUsed[]
  total_parts_cost?: string
}

export interface ServiceAppliancePayload {
  service?: number
  appliance_type_id: number | null
  brand?: string
  model?: string
  issue_reported?: string
  diagnosis_notes?: string
  status?: ApplianceStatus
  assigned_technician?: number | null
  labor_fee: number
  labor_is_free?: boolean
  labor_original_amount?: number
  labor_discount_amount?: number
  labor_discount_percentage?: number
  labor_discount_reason?: string
}

// Appliance Item Used
export interface ApplianceItemUsed {
  id: number
  appliance: number
  item: number
  item_name: string
  item_sku: string
  item_price: string
  quantity: number
  is_free: boolean
  free_quantity: number
  promo_name?: string
  charged_quantity: number
  discount_amount?: string
  discount_percentage?: string
  discount_reason?: string
  discounted_price?: string
  line_total: string
  stall_stock_id?: number | null
  expense?: number | null
  is_cancelled?: boolean
  cancelled_at?: string | null
}

export interface ApplianceItemUsedPayload {
  appliance: number
  item: number
  quantity: number
  stall_stock?: number | null
  is_free?: boolean
  free_quantity?: number
  promo_name?: string
  discount_amount?: number
  discount_percentage?: number
  discount_reason?: string
}

// Technician Assignment
export interface TechnicianAssignment {
  id: number
  service: number
  appliance?: number | null
  technician: number // Backend returns ID, not full User object
  technician_name?: string // Optional: technician's full name from backend
  assignment_type: AssignmentType
  note?: string
}

export interface TechnicianAssignmentPayload {
  service?: number
  appliance?: number | null
  technician: number
  assignment_type: AssignmentType
  note?: string
}

// Service Payment
export interface ServicePayment {
  id: number
  service: number
  payment_type: PaymentType
  amount: string
  payment_date: string
  received_by?: User | null
  notes?: string
  created_at: string
  updated_at: string
}

export interface ServicePaymentPayload {
  service: number
  payment_type: PaymentType
  amount: number
  payment_date?: string
  received_by?: number
  notes?: string
}

// Service Refund
export interface ServiceRefund {
  id: number
  service: number
  refund_amount: string
  refund_type: "full" | "partial"
  refund_type_display?: string
  reason: string
  refund_date: string
  processed_by?: number | null
  processed_by_name?: string
  refund_method: "cash" | "gcash" | "bank_transfer"
  refund_method_display?: string
  notes?: string
  created_at: string
}

export interface ServiceRefundPayload {
  service: number
  refund_amount: number
  refund_type: "full" | "partial"
  reason: string
  processed_by?: number
  refund_method: "cash" | "gcash" | "bank_transfer"
  notes?: string
}

// Service
export interface Service {
  id: number
  client: Client
  stall?: Stall | null
  service_type: ServiceType
  service_mode: ServiceMode
  related_transaction?: number | null
  description?: string
  override_address?: string
  override_contact_person?: string
  override_contact_number?: string
  appointment_datetime?: string
  pickup_date?: string
  delivery_date?: string
  received_at?: string
  status: ServiceStatus
  remarks?: string
  notes?: string
  created_at: string
  updated_at: string
  main_stall_revenue: string
  sub_stall_revenue: string
  total_revenue: string
  payment_status: PaymentStatus
  total_cost?: string
  scheduled_end_time?: string
  total_paid?: string
  balance_due?: string
  net_revenue?: string
  has_refunds?: boolean
  // Cancellation fields
  cancellation_reason?: string | null
  cancellation_date?: string | null
  // Refund fields
  total_refunded?: string
  last_refund_date?: string | null
  // Discount fields
  service_discount_amount?: string
  service_discount_percentage?: string
  discount_reason?: string
  appliances?: ServiceAppliance[]
  technician_assignments?: TechnicianAssignment[]
  payments?: ServicePayment[]
}

export interface ServicePayload {
  client: number
  service_type: ServiceType
  service_mode: ServiceMode
  related_transaction?: number | null
  description?: string
  override_address?: string
  override_contact_person?: string
  override_contact_number?: string
  appointment_datetime?: string
  pickup_date?: string
  delivery_date?: string
  received_at?: string
  status?: ServiceStatus
  remarks?: string
  notes?: string
  cancellation_reason?: string
  service_discount_amount?: number
  service_discount_percentage?: number
  discount_reason?: string
  technician_assignments?: TechnicianAssignmentPayload[]
}

// Aircon Installation
export interface AirconInstallation {
  id: number
  service: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface AirconInstallationPayload {
  service: number
  notes?: string
}

// Warranty Claim
export type ClaimStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "in_progress"
  | "completed"
  | "cancelled"
export type ClaimType = "repair" | "replacement" | "parts" | "inspection"

export interface WarrantyClaim {
  id: number
  unit: AirconUnits
  service?: number | null
  claim_type: ClaimType
  status: ClaimStatus
  issue_description: string
  customer_notes?: string
  technician_assessment?: string
  is_valid_claim: boolean
  reviewed_by?: User | null
  reviewed_at?: string
  rejection_reason?: string
  estimated_cost: string
  actual_cost: string
  claim_date: string
  completed_at?: string
  created_at: string
  updated_at: string
  is_pending?: boolean
  is_approved?: boolean
  warranty_days_remaining_at_claim?: number
}

export interface WarrantyClaimPayload {
  unit: number
  service?: number | null
  claim_type: ClaimType
  status?: ClaimStatus
  issue_description: string
  customer_notes?: string
  technician_assessment?: string
  is_valid_claim?: boolean
  reviewed_by?: number | null
  rejection_reason?: string
  estimated_cost?: number
  actual_cost?: number
  claim_date?: string
  completed_at?: string
}

// Schedule
export type ScheduleType = "home_service" | "pull_out" | "return" | "on_site"
export type ScheduleStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rescheduled"

export interface Schedule {
  id: number
  client: Client
  service?: number
  technicians?: User[]
  schedule_type: ScheduleType
  scheduled_date: string
  scheduled_time: string
  estimated_duration: number
  status: ScheduleStatus
  address?: string
  contact_person?: string
  contact_number?: string
  notes?: string
  created_at: string
  updated_at: string
}
