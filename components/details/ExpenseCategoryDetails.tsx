import { Detail } from '@/components/details/Detail'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExpenseCategory } from '@/lib/constants/interface'
import { formatCurrency } from '@/lib/utils/helpers'
import { formatDate } from '@/lib/utils/helpers/date'
import {
  Calendar,
  DollarSign,
  FolderTree,
  Layers,
  FileText,
  CheckCircle,
  XCircle,
} from 'lucide-react'

export function ExpenseCategoryDetails({
  entity,
  onClose,
}: {
  entity: ExpenseCategory
  onClose: () => void
}) {
  return (
    <div className="space-y-8">
      {/* Status badges */}
      <div className="flex items-center gap-4">
        <Badge variant={entity?.is_active ? 'default' : 'secondary'}>
          {entity?.is_active ? (
            <CheckCircle className="w-3 h-3 mr-1" />
          ) : (
            <XCircle className="w-3 h-3 mr-1" />
          )}
          {entity?.is_active ? 'Active' : 'Inactive'}
        </Badge>
        {entity?.parent_data && (
          <Badge variant="outline">
            <FolderTree className="w-3 h-3 mr-1" />
            Subcategory
          </Badge>
        )}
      </div>

      {/* Category Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Category Information</h3>

        <Detail
          label="Category Name"
          value={entity?.name}
          icon={<Layers className="w-4 h-4" />}
        />

        {entity?.description && (
          <Detail
            label="Description"
            value={entity.description}
            icon={<FileText className="w-4 h-4" />}
          />
        )}

        {entity?.parent_data && (
          <Detail
            label="Parent Category"
            value={entity.parent_data.name}
            icon={<FolderTree className="w-4 h-4" />}
          />
        )}
      </div>

      {/* Budget Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Budget Information</h3>

        <Detail
          label="Monthly Budget"
          value={
            entity?.monthly_budget && entity.monthly_budget > 0
              ? formatCurrency(entity.monthly_budget)
              : 'Not set'
          }
          icon={<DollarSign className="w-4 h-4" />}
        />

        {entity?.monthly_budget > 0 && (
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">
              Budget Status
            </p>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                This category has a monthly budget limit of{' '}
                <span className="font-semibold">
                  {formatCurrency(entity.monthly_budget)}
                </span>
              </p>
              {/* Budget tracking will be implemented in future phase */}
              <p className="text-xs text-muted-foreground italic">
                Budget tracking coming soon
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Subcategories */}
      {entity?.subcategories && entity.subcategories.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Subcategories</h3>
          <div className="space-y-2">
            {entity.subcategories.map((subcat) => (
              <div
                key={subcat.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{subcat.name}</span>
                </div>
                <Badge variant={subcat.is_active ? 'default' : 'secondary'}>
                  {subcat.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Metadata</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Detail
            label="Created At"
            value={
              entity?.created_at
                ? formatDate(
                    new Date(entity.created_at),
                    'EEE, MMM dd yyyy • hh:mm a',
                  )
                : 'N/A'
            }
            icon={<Calendar className="w-4 h-4" />}
          />
          <Detail
            label="Last Updated"
            value={
              entity?.updated_at
                ? formatDate(
                    new Date(entity.updated_at),
                    'EEE, MMM dd yyyy • hh:mm a',
                  )
                : 'N/A'
            }
            icon={<Calendar className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </div>
    </div>
  )
}
