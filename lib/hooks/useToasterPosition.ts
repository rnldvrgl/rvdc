"use client";

import { useEffect, useState } from "react";

type ToasterPosition =
	| "top-left"
	| "top-right"
	| "bottom-left"
	| "bottom-right"
	| "top-center"
	| "bottom-center";

interface UseToasterPositionOptions {
	mobilePosition?: ToasterPosition;
	desktopPosition?: ToasterPosition;
	breakpoint?: number;
}

export function useToasterPosition({
	mobilePosition = "bottom-center",
	desktopPosition = "top-right",
	breakpoint = 768,
}: UseToasterPositionOptions = {}): ToasterPosition {
	const [position, setPosition] = useState<ToasterPosition>(desktopPosition);
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		// Mark that we're now on the client
		setIsClient(true);

		// Function to update position based on window width
		const updatePosition = () => {
			const width = window.innerWidth;
			setPosition(width > breakpoint ? desktopPosition : mobilePosition);
		};

		// Set initial position
		updatePosition();

		// Add resize listener
		window.addEventListener("resize", updatePosition);

		// Cleanup
		return () => window.removeEventListener("resize", updatePosition);
	}, [mobilePosition, desktopPosition, breakpoint]);

	// Return desktop position during SSR to avoid hydration mismatch
	if (!isClient) {
		return desktopPosition;
	}

	return position;
}

export function useIsMobile(breakpoint: number = 768): boolean {
	const [isMobile, setIsMobile] = useState(false);
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);

		const updateIsMobile = () => {
			setIsMobile(window.innerWidth <= breakpoint);
		};

		updateIsMobile();
		window.addEventListener("resize", updateIsMobile);

		return () => window.removeEventListener("resize", updateIsMobile);
	}, [breakpoint]);

	if (!isClient) {
		return false;
	}

	return isMobile;
}
