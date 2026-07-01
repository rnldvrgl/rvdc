"use client"

import { ConfirmDialog } from "@/components/custom/shared/ConfirmDialog"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { useConfirmClose } from "@/lib/hooks/useConfirmClose"
import { cn } from "@/lib/utils/helpers"

interface EntitySheetProps<T> {
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
    className?: string
}

export default function EntitySheet<T>({
    open,
    onClose,
    entity,
    title,
    description,
    renderForm,
    withCloseConfirmation = false,
    className,
}: EntitySheetProps<T>) {
    const { tryClose, confirmOpen, setConfirmOpen, confirmClose } =
        useConfirmClose({
            shouldConfirm: withCloseConfirmation,
            onClose,
        })

    return (
        <>
            <Sheet
                open={open}
                onOpenChange={(next) => !next && tryClose()}
            >
                <SheetContent
                    side="right"
                    className={cn(
                        "w-full max-w-[100vw] overflow-x-hidden px-4 py-8 sm:w-auto sm:min-w-[480px] sm:max-w-lg sm:px-6 overflow-y-auto",
                        className,
                    )}
                >
                    <SheetHeader className="mb-4 border-b border-border pb-4">
                        <SheetTitle className="text-xl font-semibold">{title}</SheetTitle>
                        <SheetDescription>{description}</SheetDescription>
                    </SheetHeader>

                    {renderForm({
                        entity,
                        onClose: tryClose,
                        forceClose: onClose,
                    })}
                </SheetContent>
            </Sheet>

            <ConfirmDialog
                open={confirmOpen}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={confirmClose}
            />
        </>
    )
}
