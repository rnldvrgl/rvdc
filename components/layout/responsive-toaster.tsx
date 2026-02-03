"use client";

import { Toaster } from "@/components/ui/sonner";
import { useToasterPosition } from "@/lib/hooks/useToasterPosition";

interface ResponsiveToasterProps {
	mobilePosition?:
		| "top-left"
		| "top-right"
		| "bottom-left"
		| "bottom-right"
		| "top-center"
		| "bottom-center";
	desktopPosition?:
		| "top-left"
		| "top-right"
		| "bottom-left"
		| "bottom-right"
		| "top-center"
		| "bottom-center";
	breakpoint?: number;
	closeButton?: boolean;
	richColors?: boolean;
	expand?: boolean;
	duration?: number;
}

/**
 * Responsive Toaster component that adapts position based on screen size
 *
 * @param mobilePosition - Toaster position on mobile devices (default: "bottom-center")
 * @param desktopPosition - Toaster position on desktop devices (default: "top-right")
 * @param breakpoint - Screen width breakpoint in pixels (default: 768)
 * @param closeButton - Show close button on toasts (default: true)
 * @param richColors - Enable rich colors for toast types (default: true)
 * @param expand - Expand toasts by default (default: false)
 * @param duration - Default duration for toasts in milliseconds (default: 4000)
 *
 * @example
 * ```tsx
 * <ResponsiveToaster />
 * ```
 *
 * @example
 * ```tsx
 * <ResponsiveToaster
 *   mobilePosition="top-center"
 *   desktopPosition="bottom-right"
 *   breakpoint={1024}
 *   closeButton={true}
 * />
 * ```
 */
export function ResponsiveToaster({
	mobilePosition = "bottom-center",
	desktopPosition = "top-center",
	breakpoint = 768,
	closeButton = true,
	richColors = true,
	expand = false,
	duration = 4000,
}: ResponsiveToasterProps) {
	const position = useToasterPosition({
		mobilePosition,
		desktopPosition,
		breakpoint,
	});

	return (
		<Toaster
			position={position}
			closeButton={closeButton}
			richColors={richColors}
			expand={expand}
			duration={duration}
		/>
	);
}
