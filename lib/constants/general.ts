import { EventType } from "@/components/custom/shared/calendar/DashboardCalendar"
import { Roles } from "@/lib/constants/types"
import { makeFormattedRange } from "@/lib/utils/helpers/date"

export const ROLES = [
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "Clerk", value: "clerk" },
]

export const RESERVED_QUERY_KEYS = new Set([
  "page",
  "limit",
  "search",
  "ordering",
  "start_date",
  "end_date",
])

export const DATE_RANGE_PRESETS = [
  {
    label: "Today",
    range: makeFormattedRange(0),
  },
  {
    label: "Last 7 Days",
    range: makeFormattedRange(6),
  },
  {
    label: "Last 14 Days",
    range: makeFormattedRange(13),
  },
  {
    label: "Last 30 Days",
    range: makeFormattedRange(29),
  },
  {
    label: "This Year",
    range: {
      from: new Date(new Date().getFullYear(), 0, 1),
      to: new Date(new Date().getFullYear(), 11, 31),
    },
  },
]

export enum ChequeStatus {
  PENDING = "pending",
  DEPOSITED = "deposited",
  ENCASHED = "encashed",
  RETURNED = "returned",
  BOUNCED = "bounced",
  CANCELLED = "cancelled",
}

export enum AirconTypes {
  WINDOW = "window",
  SPLIT = "split",
  FLOOR_MOUNTED = "floor_mounted",
  CASSETTE = "cassette",
  PORTABLE = "portable",
  CENTRALIZED = "centralized",
  CEILING_SUSPENDED_FLOOR = "ceiling_suspended_floor"
}

/** Centralized staleTime constants for React Query caching */
export const STALE_TIME = {
  /** 30 seconds — near real-time data (notifications, cursor queries) */
  REAL_TIME: 30 * 1000,
  /** 1 minute — frequently changing data (remittance previews) */
  SHORT: 60 * 1000,
  /** 2 minutes — moderately fresh data (pending items) */
  FRESH: 2 * 60 * 1000,
  /** 5 minutes — default for most list/detail queries */
  DEFAULT: 5 * 60 * 1000,
  /** 24 hours — rarely changing data (user profile, system settings) */
  STATIC: 24 * 60 * 60 * 1000,
  /** Infinity — immutable reference data (PSGC geodata) */
  IMMUTABLE: Infinity,
} as const

export const ROLE_DESCRIPTIONS: Record<Roles, string> = {
    admin: "Monitor your business performance with real-time analytics, sales metrics, and operational insights.",
    manager: "View key performance indicators and metrics to help manage your team's productivity and efficiency.",
    technician: "Access your personal performance metrics and stay updated with your tasks and schedules.",
    clerk: "Access essential business metrics and reports to assist in daily operations and record-keeping.",
    guest: "Welcome to the dashboard. Please contact your administrator for access.",
}

export const NON_ADMIN_CALENDAR_EVENTS: EventType[] = [
    "birthday",
    "custom_event",
    "holiday",
    "half_day",
    "shop_closed",
    "leave",
]

export const RECENT_ITEMS_KEY = "rvdc_recent_sale_items"
export const MAX_RECENT_ITEMS = 8

export const TEMPLATE_NAME_MAX_LENGTH = 40
