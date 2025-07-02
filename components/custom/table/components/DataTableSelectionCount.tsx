import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useNavigation } from '@/lib/hooks/useNavigation'
import useSearchParameters from '@/lib/hooks/useSearchParameters'

const DataTableSelectionCount = () => {
  const { limit, ordering, search } = useSearchParameters()
  const { push } = useNavigation()

  return (
    <div className="flex items-center space-x-2">
      <p className="text-sm font-medium">Rows per page</p>
      <Select
        value={`${limit}`}
        onValueChange={(value) => {
          push({
            page: 1,
            limit: Number(value),
            ordering,
            search,
          })
        }}
      >
        <SelectTrigger className="h-8 w-[70px]">
          <SelectValue placeholder={`${limit}`} />
        </SelectTrigger>
        <SelectContent side="top">
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <SelectItem
              key={pageSize}
              value={`${pageSize}`}
            >
              {pageSize}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default DataTableSelectionCount
