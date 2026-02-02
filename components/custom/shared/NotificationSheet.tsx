import EntitySheet from "@/components/custom/shared/EntitySheet"
import { ExpenseDetails } from "@/components/details/ExpenseDetails"
import { Expense } from "@/lib/constants/interface"
import { useExpense } from "@/lib/queries/useExpenses"

type NotificationSheetProps = {
  type: "expense_created" | "transfer_created"
  id: number
  onClose: () => void
}

const NotificationSheet = ({ type, id, onClose }: NotificationSheetProps) => {
  if (type === "expense_created") {
    return (
      <ExpenseSheet
        id={id}
        onClose={onClose}
      />
    )
  }
  return null
}

const ExpenseSheet = ({ id, onClose }: { id: number; onClose: () => void }) => {
  const { data } = useExpense(id.toString())

  return (
    <EntitySheet<Expense>
      open={true}
      onClose={onClose}
      entity={data}
      title="Expense Details"
      description="Review the details of this expense."
      renderForm={({ onClose, entity }) =>
        entity ? (
          <ExpenseDetails
            entity={entity}
            onClose={onClose}
          />
        ) : null
      }
    />
  )
}

export default NotificationSheet
