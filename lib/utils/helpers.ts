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
  // base
  'outline outline-offset-2 outline-0 focus-visible:outline-2',
  // outline color
  'outline-indigo-500 dark:outline-indigo-500',
]

export const concatString = (...args: string[]) => args.join(' ')
