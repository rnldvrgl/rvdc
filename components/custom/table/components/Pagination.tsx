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
  const { page, limit, ordering, search } = useSearchParameters()
  const totalPages = Math.max(1, Math.ceil(Number(count) / Number(limit)))
  const { push } = useNavigation()

  const goToPage = (newPage: number) => {
    const safePage = Math.max(1, Math.min(newPage, totalPages))
    push({
      page: safePage,
      limit,
      ordering,
      search,
    })
  }

  const renderPageButton = (pageNumber: number) => (
    <Button
      key={pageNumber}
      variant={pageNumber === page ? 'default' : 'outline'}
      size="icon"
      className="h-8 w-8"
      onClick={() => goToPage(pageNumber)}
    >
      {pageNumber}
    </Button>
  )

  const renderEllipsis = (key: string) => (
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

  const renderPagination = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map(
        renderPageButton,
      )
    }

    const items: React.ReactNode[] = []

    items.push(renderPageButton(1))

    if (page > 3) {
      items.push(renderEllipsis('left'))
    }

    const startPage = Math.max(2, page - 1)
    const endPage = Math.min(totalPages - 1, page + 1)

    for (let p = startPage; p <= endPage; p++) {
      items.push(renderPageButton(p))
    }

    if (page < totalPages - 2) {
      items.push(renderEllipsis('right'))
    }

    items.push(renderPageButton(totalPages))

    return items
  }

  return (
    <div className={cn('flex items-center justify-between px-2', className)}>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden lg:flex h-8 w-8"
            disabled={!hasPrevPage}
            onClick={() => goToPage(1)}
          >
            <ChevronsLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!hasPrevPage}
            onClick={() => goToPage(page - 1)}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          {renderPagination()}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => goToPage(page + 1)}
            disabled={!hasNextPage}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden lg:flex h-8 w-8"
            onClick={() => goToPage(totalPages)}
            disabled={!hasNextPage}
          >
            <ChevronsRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
