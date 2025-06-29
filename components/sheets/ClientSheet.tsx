'use client'

import ClientForm from '@/components/forms/ClientForm'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface ClientSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client_data?: any
}

export default function ClientSheet({
  open,
  onOpenChange,
  client_data,
}: ClientSheetProps) {
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
            {client_data ? 'Edit Client' : 'Add Client'}
          </SheetTitle>
          <SheetDescription>
            Fill out the form below to {client_data ? 'edit' : 'add'} a client.
          </SheetDescription>
        </SheetHeader>

        <ClientForm
          onClose={() => onOpenChange(false)}
          client={client_data ?? undefined}
        />
      </SheetContent>
    </Sheet>
  )
}
