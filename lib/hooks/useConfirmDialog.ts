"use client";

import { useCallback, useState } from "react";

type UseConfirmDialogOptions = {
	onConfirm: () => void | Promise<void>;
	onCancel?: () => void;
	onAfterConfirm?: () => void;
};

export function useConfirmDialog({
	onConfirm,
	onCancel,
	onAfterConfirm,
}: UseConfirmDialogOptions) {
	const [open, setOpen] = useState(false);
	const [isConfirming, setIsConfirming] = useState(false);

	const openDialog = useCallback(() => {
		setOpen(true);
	}, []);

	const closeDialog = useCallback(() => {
		onCancel?.();
		setOpen(false);
	}, [onCancel]);

	const handleConfirm = useCallback(async () => {
		if (isConfirming) return;

		try {
			setIsConfirming(true);
			await onConfirm();
			onAfterConfirm?.();
			setOpen(false);
		} finally {
			setIsConfirming(false);
		}
	}, [isConfirming, onConfirm, onAfterConfirm]);

	return {
		open,
		isConfirming,
		openDialog,
		closeDialog,
		handleConfirm,
		setOpen, // escape hatch if you need manual control
	};
}
