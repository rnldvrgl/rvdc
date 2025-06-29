import { clsx, type ClassValue } from 'clsx'
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
