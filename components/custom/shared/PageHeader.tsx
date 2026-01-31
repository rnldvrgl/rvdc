"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/helpers";
import { ChevronRight, LucideIcon, RefreshCw } from "lucide-react";
import React from "react";
import { toast } from "sonner";
interface PageHeaderProps {
	icon?: LucideIcon;
	title?: string;
	description?: string;
	isAdminOnly?: boolean;
	breadcrumbs?: string[];
	variant?: "default" | "compact" | "hero";
	theme?: "default" | "primary" | "secondary" | "accent";
	className?: string;
	onRefresh?: () => void;
	isLoading?: boolean;
	actionButton?: React.ReactNode;
}

const PageHeader = ({
	icon: Icon,
	title,
	description,
	isAdminOnly,
	breadcrumbs,
	variant = "default",
	theme = "default",
	className,
	actionButton,
	onRefresh,
	isLoading,
}: PageHeaderProps) => {
	const themeStyles = {
		default: {
			container:
				"bg-linear-to-br from-background to-muted/50 border-border",
			accent: "bg-primary/10 text-primary border-primary/20",
			text: "text-foreground",
			description: "text-muted-foreground",
		},
		primary: {
			container:
				"bg-linear-to-br from-primary/90 to-primary border-primary/20 text-primary-foreground",
			accent: "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30",
			text: "text-primary-foreground",
			description: "text-primary-foreground/80",
		},
		secondary: {
			container:
				"bg-linear-to-br from-secondary/90 to-secondary/70 border-secondary/20",
			accent: "bg-secondary-foreground/20 text-secondary-foreground border-secondary-foreground/30",
			text: "text-secondary-foreground",
			description: "text-secondary-foreground/80",
		},
		accent: {
			container:
				"bg-linear-to-br from-accent/90 to-accent/70 border-accent/20",
			accent: "bg-accent-foreground/20 text-accent-foreground border-accent-foreground/30",
			text: "text-accent-foreground",
			description: "text-accent-foreground/80",
		},
	};

	const variantStyles = {
		compact: {
			padding: "p-4 sm:p-6",
			titleSize: "text-xl sm:text-2xl",
			iconSize: "size-6 sm:size-7",
			iconPadding: "p-2.5",
			gap: "gap-4",
		},
		default: {
			padding: "p-6 sm:p-8",
			titleSize: "text-2xl sm:text-3xl lg:text-4xl",
			iconSize: "size-7 sm:size-8 lg:size-9",
			iconPadding: "p-3 sm:p-3.5",
			gap: "gap-6",
		},
		hero: {
			padding: "p-8 sm:p-12 lg:p-16",
			titleSize: "text-3xl sm:text-4xl lg:text-5xl xl:text-6xl",
			iconSize: "size-8 sm:size-10 lg:size-12",
			iconPadding: "p-4 sm:p-5",
			gap: "gap-8",
		},
	};

	const currentTheme = themeStyles[theme];
	const currentVariant = variantStyles[variant];

	return (
		<header
			className={cn(
				"relative overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 ease-out hover:shadow-md mb-6",
				currentTheme.container,
				currentVariant.padding,
				className,
			)}
		>
			{/* Subtle background pattern */}
			<div className="absolute inset-0 opacity-40">
				<div className="absolute inset-0 bg-linear-to-br from-transparent dark:via-white/5 dark:to-white/10 via-primary/5 to-primary/10" />
				<div
					className="absolute inset-0 opacity-30"
					style={{
						backgroundImage: `radial-gradient(circle at 25% 25%, currentColor 1px, transparent 1px)`,
						backgroundSize: "24px 24px",
					}}
				/>
			</div>

			<div className="relative z-10">
				{/* Breadcrumbs */}
				{breadcrumbs &&
					breadcrumbs.length > 0 &&
					variant !== "compact" && (
						<nav
							className="mb-4 sm:mb-6 hidden sm:block"
							aria-label="Breadcrumb"
						>
							<ol className="flex items-center gap-2 text-sm">
								{breadcrumbs.map((crumb, index) => (
									<li
										key={index}
										className="flex items-center gap-2"
									>
										{index > 0 && (
											<ChevronRight className="size-3 opacity-60" />
										)}
										<span
											className={cn(
												"transition-colors duration-200",
												index === breadcrumbs.length - 1
													? cn(
															"font-semibold",
															currentTheme.text,
														)
													: cn(
															"font-medium hover:opacity-80",
															currentTheme.description,
														),
											)}
										>
											{crumb}
										</span>
									</li>
								))}
							</ol>
						</nav>
					)}

				<div className={cn("flex flex-col", currentVariant.gap)}>
					{/* Main content */}
					<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
						{/* Title and icon section */}
						<div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 min-w-0 flex-1">
							{/* Icon */}
							{Icon && (
								<div className="shrink-0 group">
									<div
										className={cn(
											"rounded-xl transition-all duration-300 ease-out group-hover:scale-105",
											currentTheme.accent,
											currentVariant.iconPadding,
										)}
									>
										<Icon
											className={cn(
												"transition-transform duration-300 ease-out group-hover:scale-110",
												currentVariant.iconSize,
											)}
										/>
									</div>
								</div>
							)}

							{/* Text content */}
							<div className="min-w-0 flex-1 space-y-2 text-center sm:text-start">
								{title && (
									<h1
										className={cn(
											"font-bold tracking-tight leading-tight",
											currentVariant.titleSize,
											currentTheme.text,
										)}
									>
										{title}
									</h1>
								)}
								{description && (
									<p
										className={cn(
											"text-sm sm:text-base leading-relaxed max-w-3xl",
											currentTheme.description,
										)}
									>
										{description}
									</p>
								)}
							</div>
						</div>

						{/* Actions and badges */}
						<div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 shrink-0">
							{/* Admin badge */}
							{isAdminOnly && (
								<Badge
									variant="destructive"
									className="bg-destructive/90 hover:bg-destructive text-destructive-foreground border-destructive/20 shadow-sm w-full xl:w-auto"
								>
									Admin Only
								</Badge>
							)}

							<div className="grid gap-2 w-full">
								{onRefresh && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											try {
												onRefresh();
												toast.success(
													"Data refreshed successfully.",
												);
											} catch {
												toast.error(
													"Failed to refresh",
												);
											}
										}}
										disabled={isLoading}
									>
										<RefreshCw
											className={`size-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
										/>
										Refresh
									</Button>
								)}
								{/* Custom actions */}
								{actionButton && actionButton}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Bottom accent line */}
			<div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-current/20 to-transparent opacity-50" />
		</header>
	);
};

export default PageHeader;
