import { timeZone } from '@/lib/constants/date'
import { format, startOfToday, subDays } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'

export const makeFormattedRange = (daysAgo: number) => {
  const from = subDays(startOfToday(), daysAgo)
  const to = startOfToday()
  return {
    from: new Date(formatBackDate(from)),
    to: new Date(formatBackDate(to)),
  }
}

export function formatDate(date: Date, formatStr = 'yyyy-MM-dd') {
  return format(toZonedTime(date, timeZone), formatStr)
}
export function formatBackDate(date: Date, formatStr = 'yyyy-MM-dd') {
  const utcDate = fromZonedTime(date, timeZone)
  return format(utcDate, formatStr)
}
