import { LucideIcon } from "lucide-react";
import React, { useState } from "react";

interface PageHeaderProps {
	icon?: LucideIcon;
	title?: string;
	description?: string;
	isAdminOnly?: boolean;
	actions?: React.ReactNode;
	breadcrumbs?: string[];
	variant?: "default" | "compact" | "hero";
	theme?: "primary" | "secondary" | "gradient" | "glass";
}

const PageHeader = ({
	icon: Icon,
	title,
	description,
	isAdminOnly,
	actions,
	breadcrumbs,
	variant = "default",
	theme = "primary",
}: PageHeaderProps) => {
	const [isHovered, setIsHovered] = useState(false);

	const themeClasses = {
		primary:
			"bg-gradient-to-br from-primary/50 via-primary/60 to-primary text-white border-primary/20",
		secondary:
			"bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 text-white border-slate-300/20",
		gradient:
			"bg-gradient-to-br from-primary via-red-500 to-secondary text-white border-white/10",
		glass: "bg-white/10 dark:bg-black/10 backdrop-blur-xl border-white/20 dark:border-white/10 text-foreground shadow-2xl",
	};

	const variantClasses = {
		default: "p-6 sm:p-8 lg:p-10",
		compact: "p-4 sm:p-6 lg:p-8",
		hero: "p-8 sm:p-12 lg:p-16",
	};

	const titleSizes = {
		default: "text-2xl sm:text-3xl lg:text-4xl xl:text-5xl",
		compact: "text-xl sm:text-2xl lg:text-3xl",
		hero: "text-3xl sm:text-4xl lg:text-6xl xl:text-7xl",
	};

	const isGlassTheme = theme === "glass";
	const textColor = isGlassTheme ? "text-foreground" : "text-white";
	const mutedTextColor = isGlassTheme
		? "text-muted-foreground"
		: "text-white/90";

	return (
		<div
			className={`relative overflow-hidden rounded-3xl ${themeClasses[theme]} ${variantClasses[variant]} shadow-2xl border transition-all duration-700 ease-out hover:shadow-3xl hover:scale-[1.02] group mb-8`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Animated mesh gradient background */}
			{!isGlassTheme && (
				<div className="absolute inset-0 opacity-30">
					<div className="absolute top-0 -left-4 size-72 bg-white/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
					<div className="absolute top-0 -right-4 w-72 h-72 bg-white/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
					<div className="absolute -bottom-8 left-20 w-72 h-72 bg-white/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
				</div>
			)}

			{/* Geometric pattern overlay */}
			<div className="absolute inset-0">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)] opacity-50"></div>
				<div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-white/5 to-transparent rounded-full translate-x-48 -translate-y-48"></div>
				<div className="absolute bottom-0 left-0 w-64 h-64 bg-linear-to-tr from-white/5 to-transparent rounded-full -translate-x-32 translate-y-32"></div>
			</div>

			{/* Dynamic grid pattern */}
			<div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[20px_20px] opacity-40 transition-opacity duration-500 group-hover:opacity-60"></div>

			{/* Floating orbs */}
			<div
				className={`absolute top-8 right-8 w-24 h-24 bg-lieaner-to-br from-white/10 to-white/5 rounded-full blur-sm transition-all duration-1000 ${
					isHovered
						? "scale-125 opacity-80 rotate-12"
						: "scale-100 opacity-60"
				}`}
			></div>
			<div
				className={`absolute bottom-8 left-8 w-16 h-16 bg-lienar-to-br from-white/10 to-white/5 rounded-full blur-sm transition-all duration-700 delay-150 ${
					isHovered
						? "scale-150 opacity-70 -rotate-12"
						: "scale-100 opacity-50"
				}`}
			></div>

			<div className="relative z-10">
				{/* Modern breadcrumbs */}
				{breadcrumbs &&
					breadcrumbs.length > 0 &&
					variant !== "compact" && (
						<nav
							className={`mb-6 sm:mb-8 ${variant === "hero" ? "lg:mb-10" : ""}`}
							aria-label="Breadcrumb"
						>
							<div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
								{breadcrumbs.map((crumb, index) => (
									<React.Fragment key={index}>
										{index > 0 && (
											<div className="mx-2 w-1.5 h-1.5 bg-current opacity-40 rounded-full"></div>
										)}
										<span
											className={`text-xs font-medium transition-all duration-300 ${
												index === breadcrumbs.length - 1
													? `${textColor} font-semibold`
													: `${mutedTextColor} hover:text-current`
											}`}
										>
											{crumb}
										</span>
									</React.Fragment>
								))}
							</div>
						</nav>
					)}

				<div
					className={`flex flex-col ${variant === "compact" ? "gap-4" : "gap-6 sm:gap-8"}`}
				>
					{/* Main content area */}
					<div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
						{/* Icon and text content */}
						<div className="flex items-start gap-4 sm:gap-6 flex-1 min-w-0">
							{Icon && (
								<div className="group/icon relative">
									<div className="p-3 sm:p-4 lg:p-5 bg-white/20 backdrop-blur-lg rounded-2xl sm:rounded-3xl shrink-0 border border-white/20 shadow-xl transition-all duration-500 hover:bg-white/30 hover:scale-110 hover:rotate-6 hover:shadow-2xl">
										<Icon
											className={`size-7 sm:w-9 sm:h-9 lg:w-11 lg:h-11 ${textColor} transition-all duration-500 group-hover/icon:scale-110 group-hover/icon:rotate-12`}
										/>
									</div>
									{/* Icon halo effect */}
									<div className="absolute inset-0 bg-white/10 rounded-2xl sm:rounded-3xl blur-md scale-150 opacity-0 group-hover/icon:opacity-100 transition-all duration-500"></div>
								</div>
							)}
							<div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
								{title && (
									<h1
										className={`${titleSizes[variant]} font-bold ${textColor} tracking-tight leading-tight`}
									>
										{/*<span className="bg-linear-to-r from-current via-current/95 to-current/90 bg-clip-text text-transparent drop-shadow-sm">*/}
										{title}
										{/*</span>*/}
									</h1>
								)}
								{description && (
									<p
										className={`${mutedTextColor} text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl font-medium`}
									>
										{description}
									</p>
								)}
							</div>
						</div>

						{/* Actions and badges container */}
						<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
							{/* Admin badge */}
							{isAdminOnly && (
								<div className="inline-flex items-center gap-3 px-4 sm:px-5 py-2 sm:py-2.5 bg-linear-to-r from-red-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl text-white text-sm sm:text-base font-semibold border border-red-300/30 shadow-lg transition-all duration-500 hover:from-red-500/30 hover:to-orange-500/30 hover:scale-105 hover:shadow-xl">
									<div className="relative">
										<div className="size-2 bg-red-400 rounded-full animate-pulse"></div>
										<div className="absolute inset-0 size-2 bg-red-400 rounded-full animate-ping"></div>
									</div>
									<span>Admin Only</span>
								</div>
							)}

							{/* Custom actions */}
							{actions && (
								<div className="flex items-center gap-3">
									{actions}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Bottom shine effect */}
			<div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent">
				<div
					className={`h-full bg-linear-to-r from-transparent via-white/60 to-transparent transition-all duration-1000 ${
						isHovered ? "opacity-100" : "opacity-0"
					}`}
				></div>
			</div>

			{/* Corner highlights */}
			<div className="absolute top-0 left-0 w-32 h-32 bg-linear-to-br from-white/10 via-white/5 to-transparent rounded-br-3xl"></div>
			<div className="absolute bottom-0 right-0 w-24 h-24 bg-linear-to-tl from-white/10 via-white/5 to-transparent rounded-tl-3xl"></div>
		</div>
	);
};

export default PageHeader;
