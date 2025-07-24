import { FilterDefinition } from '@/lib/constants/types'
import { StoreIcon, TagIcon } from 'lucide-react'

export const salesFilters: FilterDefinition[] = [
  {
    key: 'stall',
    label: 'Stall',
    icon: StoreIcon,
    options: [
      { label: 'Main Stall', value: '1' },
      { label: 'Sub Stall', value: '2' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    icon: TagIcon,
    options: [
      { label: 'Paid', value: 'paid' },
      { label: 'Unpaid', value: 'unpaid' },
    ],
  },
]
