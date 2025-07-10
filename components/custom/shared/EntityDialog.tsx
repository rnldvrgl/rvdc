'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface EntityDialogProps<T> {
  open: boolean
  onOpenChange: (open: boolean) => void
  entity?: T
  title: string
  description: string
  renderForm: (props: { entity?: T; onClose: () => void }) => React.ReactNode
}

export default function EntityDialog<T>({
  open,
  onOpenChange,
  entity,
  title,
  description,
  renderForm,
}: EntityDialogProps<T>) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="w-full  p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {renderForm({
          entity,
          onClose: () => onOpenChange(false),
        })}
      </DialogContent>
    </Dialog>
  )
}
