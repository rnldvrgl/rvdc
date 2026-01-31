import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LucideProps } from "lucide-react"
import * as react from "react"

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = "Discard changes?",
  description = "You have unsaved changes. They will be lost.",
  Icon,
  confirmText = "Discard",
  cancelText = "Cancel",
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title?: string
  Icon?: react.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & react.RefAttributes<SVGSVGElement>
  >
  description?: string
  confirmText?: string
  cancelText?: string
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onCancel()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center rounded-md"
          >
            {Icon && <Icon className="mr-1 size-4" />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
