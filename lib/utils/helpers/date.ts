import { formatBackDate } from '@/lib/utils/helpers'
import { startOfToday, subDays } from 'date-fns'

export const makeFormattedRange = (daysAgo: number) => {
  const from = subDays(startOfToday(), daysAgo)
  const to = startOfToday()
  return {
    from: new Date(formatBackDate(from)),
    to: new Date(formatBackDate(to)),
  }
}
