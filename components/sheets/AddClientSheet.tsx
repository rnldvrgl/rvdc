'use client'

import AddClientForm from '@/components/forms/AddClientForm'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useEffect } from 'react'

interface AddClientSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  focusRef?: React.RefObject<HTMLElement>
}

export default function AddClientSheet({
  open,
  onOpenChange,
  focusRef,
}: AddClientSheetProps) {
  // On close, return focus to trigger
  useEffect(() => {
    if (!open && focusRef?.current) {
      focusRef.current.focus()
    }
  }, [open, focusRef])

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
          <SheetTitle className="text-xl font-semibold">
            Add New Client
          </SheetTitle>
          <SheetDescription>
            Fill out the form below to add a new client to your records.
          </SheetDescription>
        </SheetHeader>

        <AddClientForm />
      </SheetContent>
    </Sheet>
  )
}
