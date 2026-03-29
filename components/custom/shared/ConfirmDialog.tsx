import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/helpers"
import { AlertTriangle, type LucideIcon, XCircle } from "lucide-react"

const VARIANT_CONFIG = {
  destructive: {
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    confirmClass: "bg-red-600 hover:bg-red-700 text-white",
    DefaultIcon: AlertTriangle,
  },
  default: {
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    confirmClass: "",
    DefaultIcon: AlertTriangle,
  },
} as const

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = "Discard changes?",
  description = "You have unsaved changes. They will be lost.",
  Icon,
  confirmText = "Discard",
  cancelText = "Cancel",
  variant = "destructive",
  isLoading = false,
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title?: string
  Icon?: LucideIcon
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "default"
  isLoading?: boolean
}) {
  const config = VARIANT_CONFIG[variant]
  const DisplayIcon = Icon || config.DefaultIcon

  return (
    <AlertDialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onCancel()}
    >
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center sm:text-center">
          <div
            className={cn(
              "mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full",
              config.iconBg,
            )}
          >
            <DisplayIcon className={cn("h-7 w-7", config.iconColor)} />
          </div>
          <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn("w-full", config.confirmClass)}
          >
            {DisplayIcon && <DisplayIcon className="mr-2 h-4 w-4" />}
            {confirmText}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full"
          >
            <XCircle className="mr-2 h-4 w-4" />
            {cancelText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
