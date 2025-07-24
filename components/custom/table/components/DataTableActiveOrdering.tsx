import { Button } from '@/components/ui/button'
import { useNavigation } from '@/lib/hooks/useNavigation'
import useSearchParameters from '@/lib/hooks/useSearchParameters'
import { X } from 'lucide-react'

function DataTableActiveOrdering() {
  const { ordering, ...rest } = useSearchParameters()
  const { push } = useNavigation()

  if (!ordering) return null

  const isDesc = ordering.startsWith('-')
  const field = isDesc ? ordering.slice(1) : ordering
  const direction = isDesc ? '↓' : '↑'

  return (
    <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full border text-sm border-border">
      <span>
        Sort: {field} {direction}
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="h-4 w-4 p-0 hover:bg-transparent"
        onClick={() => push({ ...rest, ordering: undefined })}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

export default DataTableActiveOrdering
