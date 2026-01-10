"use client";

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
import React, { ReactNode, useCallback, useMemo, useState } from "react";

/**
 * ConfirmAlertProps
 *
 * Supports both uncontrolled (internal open state) and controlled modes:
 * - Uncontrolled: omit `open` and `onOpenChange`, optionally provide a `trigger` to open the dialog
 * - Controlled: provide `open` and `onOpenChange` to manage the dialog state externally
 */
type BaseConfirmAlertProps = {
	trigger?: ReactNode;
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
	isConfirming?: boolean;
	onConfirm: () => void | Promise<void>;
	onCancel?: () => void;
	requireConfirm?: boolean;
};

type UncontrolledProps = BaseConfirmAlertProps & {
	open?: never;
	onOpenChange?: never;
};

type ControlledProps = BaseConfirmAlertProps & {
	open: boolean;
	onOpenChange: (next: boolean) => void;
};

export type ConfirmAlertProps = UncontrolledProps | ControlledProps;

/**
 * ConfirmAlert
 *
 * A reusable confirmation dialog that mirrors the DataTableActions alert behavior.
 * - Supports both controlled and uncontrolled open state
 * - Optional trigger element to open the dialog
 * - Customizable title, description, and button labels
 * - Optional destructive styling via `confirmVariant`
 * - Handles async confirm flows and disables close while confirming
 *
 * Usage (uncontrolled):
 *  <ConfirmAlert
 *    trigger={<Button variant="destructive">Delete</Button>}
 *    title="Delete holiday?"
 *    description="This action cannot be undone."
 *    confirmText="Delete"
 *    confirmVariant="destructive"
 *    onConfirm={handleDelete}
 *  />
 *
 * Usage (controlled):
 *  const [open, setOpen] = useState(false)
 *  <ConfirmAlert
 *    open={open}
 *    onOpenChange={setOpen}
 *    title="Proceed?"
 *    description="Confirm to continue."
 *    onConfirm={doConfirm}
 *  />
 */
export default function ConfirmAlert(props: ConfirmAlertProps) {
	const {
		trigger,
		title = "Are you sure?",
		description = "This action cannot be undone.",
		confirmText = "Continue",
		cancelText = "Cancel",
		confirmVariant = "default",
		isConfirming = false,
		onConfirm,
		onCancel,
		requireConfirm = false,
	} = props;

	const isControlled = useMemo(
		() => "open" in props && typeof props.open === "boolean",
		[props],
	);

	const [internalOpen, setInternalOpen] = useState<boolean>(false);
	const open = isControlled ? (props as ControlledProps).open : internalOpen;
	const onOpenChange = isControlled
		? (props as ControlledProps).onOpenChange
		: setInternalOpen;

	const handleTriggerClick = useCallback(() => {
		onOpenChange(true);
	}, [onOpenChange]);

	const handleCancel = useCallback(() => {
		if (onCancel) onCancel();
		onOpenChange(false);
	}, [onCancel, onOpenChange]);

	const handleConfirm = useCallback(async () => {
		// In uncontrolled mode or when requireConfirm, ensure dialog is open before confirming
		if (!open && requireConfirm) {
			onOpenChange(true);
			return;
		}
		await onConfirm();
		// Close after confirm if not in a persistent flow
		onOpenChange(false);
	}, [onConfirm, onOpenChange, open, requireConfirm]);

	return (
		<>
			{trigger ? (
				<span
					onClick={handleTriggerClick}
					style={{ display: "inline-flex" }}
				>
					{trigger}
				</span>
			) : null}

			<AlertDialog open={open} onOpenChange={onOpenChange}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{title}</AlertDialogTitle>
						<AlertDialogDescription>
							{description}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={handleCancel}
							disabled={isConfirming}
						>
							{cancelText}
						</AlertDialogCancel>
						<AlertDialogAction asChild>
							<Button
								variant={confirmVariant}
								onClick={handleConfirm}
								disabled={isConfirming}
							>
								{isConfirming ? "Processing..." : confirmText}
							</Button>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
