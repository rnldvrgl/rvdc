'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface EntitySheetProps<T> {
  open: boolean
  onOpenChange: (open: boolean) => void
  entity?: T
  title: string
  description: string
  renderForm: (props: { entity?: T; onClose: () => void }) => React.ReactNode
}

export default function EntitySheet<T>({
  open,
  onOpenChange,
  entity,
  title,
  description,
  renderForm,
}: EntitySheetProps<T>) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="max-w-md w-full px-6 py-8 overflow-y-auto"
      >
        <SheetHeader className="mb-4 border-b border-border pb-4">
          <SheetTitle className="text-xl font-semibold">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {renderForm({
          entity,
          onClose: () => onOpenChange(false),
        })}
      </SheetContent>
    </Sheet>
  )
}
