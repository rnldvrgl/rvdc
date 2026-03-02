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
}
