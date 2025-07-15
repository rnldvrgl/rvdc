'use client'

import { ConfirmDialog } from '@/components/custom/shared/ConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useConfirmClose } from '@/lib/hooks/useConfirmClose'

interface EntityDialogProps<T> {
  open: boolean
  onClose: () => void
  entity?: T
  title: string
  description: string
  renderForm: (props: {
    entity?: T
    onClose: () => void
    forceClose: () => void
  }) => React.ReactNode
  withCloseConfirmation?: boolean
}

export default function EntityDialog<T>({
  open,
  onClose,
  entity,
  title,
  description,
  renderForm,
  withCloseConfirmation = false,
}: EntityDialogProps<T>) {
  const { tryClose, confirmOpen, setConfirmOpen, confirmClose } =
    useConfirmClose({
      shouldConfirm: withCloseConfirmation,
      onClose,
    })
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && tryClose()}
    >
      <DialogContent className="w-full  p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {renderForm({ entity, onClose: tryClose, forceClose: onClose })}
      </DialogContent>
      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmClose}
      />
    </Dialog>
  )
}
