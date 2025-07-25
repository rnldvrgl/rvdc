import { startOfToday, subDays } from 'date-fns'

export const ROLES = [
  { label: 'Admin', value: 'admin' },
  { label: 'Manager', value: 'manager' },
  { label: 'Clerk', value: 'clerk' },
]

export const timeZone = 'Asia/Manila'

export const RESERVED_QUERY_KEYS = new Set([
  'page',
  'limit',
  'search',
  'ordering',
  'start_date',
  'end_date',
])

export const DATE_RANGE_PRESETS = [
  {
    label: 'Today',
    range: { from: startOfToday(), to: startOfToday() },
  },
  {
    label: 'Last 7 Days',
    range: { from: subDays(startOfToday(), 6), to: startOfToday() },
  },
  {
    label: 'Last 14 Days',
    range: { from: subDays(startOfToday(), 13), to: startOfToday() },
  },
  {
    label: 'Last 30 Days',
    range: { from: subDays(startOfToday(), 29), to: startOfToday() },
  },
] as const
