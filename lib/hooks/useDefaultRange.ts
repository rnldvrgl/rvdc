import { DATE_RANGE_PRESETS } from '@/lib/constants/general'
import { DateRangePresetLabel } from '@/lib/constants/types'
import { DateRange } from 'react-day-picker'

export function useDefaultDateRange(label: DateRangePresetLabel): DateRange {
  const preset = DATE_RANGE_PRESETS.find((p) => p.label === label)
  return preset?.range ?? { from: undefined, to: undefined }
}
