import { timeZone } from '@/lib/constants/general'
import { NavListItem } from '@/lib/constants/interface'
import { Sorting } from '@/lib/constants/types'
import { clsx, type ClassValue } from 'clsx'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

import { twMerge } from 'tailwind-merge'

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
    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`
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
  if (!image) return ''
  if (typeof image === 'string' && !image.startsWith('data:')) return ''
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
    return item.children.some((child) => isPathActive(child, path))
  }
  return false
}
