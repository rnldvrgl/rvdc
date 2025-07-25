import { Button } from '@/components/ui/button'
import { useNavigation } from '@/lib/hooks/useNavigation'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { cn } from '@/lib/utils/helpers'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'
import React, { useCallback, useMemo } from 'react'

interface DataTablePaginationProps {
  hasNextPage: boolean
  hasPrevPage: boolean
  count: number
  className?: string
}

export function DataTablePagination({
  hasNextPage,
  hasPrevPage,
  count,
  className,
}: DataTablePaginationProps) {
  const {
    page = 1,
    limit = 10,
    ordering,
    search,
    filter,
  } = useSearchParameters()
  const { push } = useNavigation()

  const safePage = Number(page) || 1
  const safeLimit = Number(limit) || 10
  const safeCount = Number(count) || 0
  const totalPages = Math.max(1, Math.ceil(safeCount / safeLimit))

  const goToPage = useCallback(
    (newPage: number) => {
      const clampedPage = Math.max(1, Math.min(newPage, totalPages))
      const updatedFilter = { ...filter }
      push({
        page: clampedPage,
        limit,
        ordering,
        search,
        filter: updatedFilter,
      })
    },
    [push, limit, ordering, search, totalPages, filter],
  )

  const pageButtons = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((p) =>
        renderPageButton(p),
      )
    }

    const items: React.ReactNode[] = []
    items.push(renderPageButton(1))

    if (safePage > 3) items.push(renderEllipsis('left'))

    const startPage = Math.max(2, safePage - 1)
    const endPage = Math.min(totalPages - 1, safePage + 1)

    for (let p = startPage; p <= endPage; p++) {
      items.push(renderPageButton(p))
    }

    if (safePage < totalPages - 2) items.push(renderEllipsis('right'))

    items.push(renderPageButton(totalPages))

    return items
  }, [totalPages, safePage])

  function renderPageButton(pageNumber: number) {
    return (
      <Button
        key={pageNumber}
        variant={pageNumber === safePage ? 'default' : 'outline'}
        size="icon"
        className="size-8"
        onClick={() => goToPage(pageNumber)}
      >
        {pageNumber}
      </Button>
    )
  }

  function renderEllipsis(key: string) {
    return (
      <Button
        key={key}
        variant="outline"
        size="icon"
        className="h-8 w-8 cursor-not-allowed"
        disabled
      >
        ...
      </Button>
    )
  }

  return (
    <div className={cn('flex items-center justify-between px-2', className)}>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden lg:flex h-8 w-8"
            onClick={() => goToPage(1)}
            disabled={!hasPrevPage || safePage === 1}
          >
            <ChevronsLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => goToPage(safePage - 1)}
            disabled={!hasPrevPage}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          {pageButtons}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => goToPage(safePage + 1)}
            disabled={!hasNextPage}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden lg:flex h-8 w-8"
            onClick={() => goToPage(totalPages)}
            disabled={!hasNextPage || safePage === totalPages}
          >
            <ChevronsRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
