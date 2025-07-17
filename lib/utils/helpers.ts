import { timeZone } from '@/lib/constants/general'
import {
  CursorPaginatedResponse,
  NavListItem,
  Sorting,
} from '@/lib/constants/types'
import { clsx, type ClassValue } from 'clsx'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

import { twMerge } from 'tailwind-merge'

type badgeVariants =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const setItem = (key: string, value: unknown): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(error)
  }
}

export const getItem = <T = unknown>(key: string): T | undefined => {
  try {
    const item = window.localStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : undefined
  } catch (error) {
    console.error(error)
    return undefined
  }
}

export const removeItem = (key: string): void => {
  try {
    window.localStorage.removeItem(key)
  } catch (error) {
    console.error(error)
  }
}

export const clearStorage = (): void => {
  try {
    window.localStorage.clear()
  } catch (error) {
    console.error(error)
  }
}

export const focusRing = [
  'outline outline-offset-2 outline-0 focus-visible:outline-2',
  'outline-indigo-500 dark:outline-indigo-500',
]

export const concatString = (...args: string[]) => args.join(' ')

export function getLinkClasses(active: boolean) {
  return `flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
    ${
      active
        ? 'bg-muted text-primary'
        : 'hover:bg-muted hover:text-primary text-muted-foreground'
    }
`
}

export function getNameByCode<T extends { code: string; name: string }>(
  list: T[],
  code: string,
): string {
  return list.find((item) => item.code === code)?.name || ''
}

export function getCodeByName<T extends { code: string; name: string }>(
  list: T[],
  name: string,
): string {
  return list.find((item) => item.name === name)?.code || ''
}

export function prepareOptions<T extends { code?: string; name: string }>(
  list: T[],
): T[] {
  return list
    .filter((item) => item.code?.trim())
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Strip "data:image/png;base64," if you want
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
  })
}

export function getDisplayImage(
  image?: string,
  fallback: string = '/default_image.jpg',
) {
  return image && image.trim() !== '' ? image : fallback
}

export function formatDateToYMD(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function normalizeProfileImage(image?: string | null) {
  if (image === '') return ''
  if (!image) return undefined
  return image
}

export function formatLocalDate(date: Date, formatStr = 'yyyy-MM-dd') {
  return format(toZonedTime(date, timeZone), formatStr)
}

export function toOrdering(sorting: Sorting): string | undefined {
  if (!sorting.length) return undefined
  const { id, desc } = sorting[0]
  return `${desc ? '-' : ''}${id}`
}

export function isPathActive(item: NavListItem, path: string): boolean {
  if (item.href && path.startsWith(item.href)) return true
  if (item.children) {
    return item.children!.some((child: NavListItem) =>
      isPathActive(child, path),
    )
  }
  return false
}

export function formatDate(date: Date, formatStr = 'yyyy-MM-dd') {
  return format(toZonedTime(date, timeZone), formatStr)
}

export function formatCurrency(value: number | string) {
  if (value == null) return 'N/A'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 'N/A'
  return num.toLocaleString('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function safeCell(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''
  return String(value)
}

export function getBadgeVariant(source: string): badgeVariants {
  const variants: Record<string, badgeVariants> = {
    paid: 'success',
    high_stock: 'success',
    manual: 'secondary',
    transfer: 'default',
    partial: 'warning',
    low_stock: 'warning',
    no_stock: 'destructive',
    unpaid: 'destructive',
  }

  return variants[source] ?? 'outline'
}

export function getBoolBadgeVariant({
  status,
  reverse = false,
}: {
  status: boolean
  reverse?: boolean
}): 'success' | 'destructive' {
  if (reverse) return status ? 'destructive' : 'success'
  return status ? 'success' : 'destructive'
}

export const getHashedStallBadgeClass = (stallName: string) => {
  const colors = [
    'border-transparent bg-green-500 text-white dark:bg-green-400 dark:text-white',
    'border-transparent bg-yellow-400 text-black dark:bg-yellow-300 dark:text-black',
    'border-transparent bg-blue-500 text-white dark:bg-blue-400 dark:text-white',
    'border-transparent bg-pink-500 text-white dark:bg-pink-400 dark:text-white',
    'border-transparent bg-purple-500 text-white dark:bg-purple-400 dark:text-white',
    'border-transparent bg-teal-500 text-white dark:bg-teal-400 dark:text-white',
    'border-transparent bg-rose-500 text-white dark:bg-rose-400 dark:text-white',
    'border-transparent bg-orange-500 text-white dark:bg-orange-400 dark:text-white',
  ]

  let hash = 0
  for (let i = 0; i < stallName.length; i++) {
    hash = stallName.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash // force 32-bit integer
  }

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

export function mergeResults<T>(data?: {
  pages: CursorPaginatedResponse<T>[]
}): T[] {
  return data?.pages.flatMap((page) => page.results ?? []) ?? []
}
