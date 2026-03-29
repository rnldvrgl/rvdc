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
import {
    AlertTriangle,
    CheckCircle2,
    Info,
    type LucideIcon,
    XCircle,
} from "lucide-react"

type Variant = "destructive" | "warning" | "success" | "info" | "default"

const VARIANT_CONFIG: Record<
  Variant,
  {
    iconBg: string
    iconColor: string
    confirmClass: string
    DefaultIcon: LucideIcon
  }
> = {
  destructive: {
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    confirmClass: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    DefaultIcon: AlertTriangle,
  },
  warning: {
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    confirmClass: "bg-warning text-warning-foreground hover:bg-warning/90",
    DefaultIcon: AlertTriangle,
  },
  success: {
    iconBg: "bg-success/10",
    iconColor: "text-success",
    confirmClass: "bg-success text-success-foreground hover:bg-success/90",
    DefaultIcon: CheckCircle2,
  },
  info: {
    iconBg: "bg-info/10",
    iconColor: "text-info",
    confirmClass: "bg-info text-info-foreground hover:bg-info/90",
    DefaultIcon: Info,
  },
  default: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    confirmClass: "",
    DefaultIcon: Info,
  },
}

export type { Variant as ConfirmDialogVariant }

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
  variant?: Variant
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
