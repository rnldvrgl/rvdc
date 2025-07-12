import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = 'Discard changes?',
  description = 'You have unsaved changes. They will be lost.',
  confirmText = 'Discard',
  cancelText = 'Cancel',
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title?: string
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
          <AlertDialogAction onClick={onConfirm}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
