"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useNavigation } from "@/lib/hooks/useNavigation"
import useSearchParameters from "@/lib/hooks/useSearchParameters"

const LIMIT_OPTIONS = [10, 25, 50, 100, 200, 500] as const

export function DataTableLimitFilter() {
  const { limit = 10, ordering, search, filter } = useSearchParameters()
  const { push } = useNavigation()

  const handleLimitChange = (newLimit: string) => {
    // When changing limit, reset to page 1
    push({
      limit: parseInt(newLimit),
      page: 1,
      ordering,
      search,
      filter,
    })
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        Rows per page:
      </span>
      <Select
        value={String(limit)}
        onValueChange={handleLimitChange}
      >
        <SelectTrigger className="h-9 w-[70px] bg-white dark:bg-muted/50 border-slate-300 dark:border-slate-700 focus:ring-purple-500">
          <SelectValue placeholder={String(limit)} />
        </SelectTrigger>
        <SelectContent>
          {LIMIT_OPTIONS.map((option) => (
            <SelectItem
              key={option}
              value={String(option)}
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
