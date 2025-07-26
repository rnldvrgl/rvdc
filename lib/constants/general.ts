import { makeFormattedRange } from '@/lib/utils/helpers/date'

export const ROLES = [
  { label: 'Admin', value: 'admin' },
  { label: 'Manager', value: 'manager' },
  { label: 'Clerk', value: 'clerk' },
]

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
    range: makeFormattedRange(0),
  },
  {
    label: 'Last 7 Days',
    range: makeFormattedRange(6),
  },
  {
    label: 'Last 14 Days',
    range: makeFormattedRange(13),
  },
  {
    label: 'Last 30 Days',
    range: makeFormattedRange(29),
  },
] as const
