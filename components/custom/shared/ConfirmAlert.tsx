import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmAlertProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isConfirming?: boolean;
	disabled?: boolean;

	title?: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
	confirmVariant?:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "ghost"
		| "link";
};

export function ConfirmAlert({
	open,
	onOpenChange,
	onConfirm,
	isConfirming = false,
	disabled,
	title = "Are you sure?",
	description = "This action cannot be undone.",
	confirmText = "Continue",
	cancelText = "Cancel",
	confirmVariant = "default",
}: ConfirmAlertProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel disabled={isConfirming}>
						{cancelText}
					</AlertDialogCancel>

					<AlertDialogAction asChild>
						<Button
							variant={confirmVariant}
							onClick={onConfirm}
							disabled={isConfirming || disabled}
						>
							{isConfirming ? "Processing..." : confirmText}
						</Button>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
