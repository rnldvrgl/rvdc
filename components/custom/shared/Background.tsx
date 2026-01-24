"use client";

import { useMounted } from "@/lib/hooks/useMounted";

export function Background() {
	const mounted = useMounted();
	if (!mounted) return null;

	return (
		<div className="fixed inset-0 -z-50 overflow-hidden">
			{/* Base gradients */}
			<div className="absolute inset-0 bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
			<div className="absolute inset-0 bg-linear-to-br from-slate-50 via-cyan-50/70 to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950/40" />

			{/* Glow blobs */}
			<div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse bg-linear-to-r from-blue-400/20 to-indigo-400/20 dark:from-blue-600/10 dark:to-indigo-600/10" />
			<div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl animate-pulse bg-linear-to-r from-blue-400/20 to-cyan-400/20 dark:from-blue-600/15 dark:to-cyan-600/15" />
			<div
				className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse bg-linear-to-r from-orange-300/15 to-red-300/15 dark:from-orange-600/10 dark:to-red-600/10"
				style={{ animationDelay: "1.5s" }}
			/>
			<div
				className="absolute top-1/2 right-1/3 w-72 h-72 rounded-full blur-3xl animate-pulse bg-linear-to-r from-teal-400/20 to-emerald-400/20 dark:from-teal-600/10 dark:to-emerald-600/10"
				style={{ animationDelay: "2.5s" }}
			/>

			{/* Dot grid overlay */}
			<div
				className="absolute inset-0 opacity-30 dark:opacity-15"
				style={{
					backgroundImage:
						"radial-gradient(circle at 2px 2px, rgba(59,130,246,0.3) 1px, transparent 0)",
					backgroundSize: "32px 32px",
				}}
			/>

			{/* SVG grid */}
			<div className="absolute inset-0">
				<svg
					className="w-full h-full"
					xmlns="http://www.w3.org/2000/svg"
				>
					<defs>
						<pattern
							id="technical-grid"
							width="80"
							height="80"
							patternUnits="userSpaceOnUse"
						>
							<path
								d="M 80 0 L 0 0 0 80"
								fill="none"
								stroke="currentColor"
								strokeWidth="0.5"
								className="text-blue-200/40 dark:text-blue-800/40"
							/>
							<circle
								cx="40"
								cy="40"
								r="1"
								fill="currentColor"
								className="text-cyan-300/60 dark:text-cyan-700/40"
							/>
						</pattern>
					</defs>
					<rect
						width="100%"
						height="100%"
						fill="url(#technical-grid)"
					/>
				</svg>
			</div>

			{/* Floating particles */}
			<div className="absolute inset-0">
				<div
					className="absolute top-20 left-16 w-3 h-3 rounded-full bg-blue-400/50 dark:bg-blue-500/30 animate-bounce shadow-lg shadow-blue-400/25"
					style={{ animationDuration: "4s" }}
				/>
				<div
					className="absolute top-40 right-24 w-2 h-2 rounded-full bg-cyan-400/60 dark:bg-cyan-500/40 animate-bounce shadow-lg shadow-cyan-400/25"
					style={{
						animationDelay: "1.5s",
						animationDuration: "3.5s",
					}}
				/>
				<div
					className="absolute bottom-32 left-1/3 w-2.5 h-2.5 rounded-full bg-sky-400/50 dark:bg-sky-500/30 animate-bounce shadow-lg shadow-sky-400/25"
					style={{
						animationDelay: "2.5s",
						animationDuration: "4.5s",
					}}
				/>
				<div
					className="absolute top-60 right-1/4 w-2 h-2 rounded-full bg-orange-400/40 dark:bg-orange-500/25 animate-bounce shadow-lg shadow-orange-400/20"
					style={{
						animationDelay: "0.8s",
						animationDuration: "3.8s",
					}}
				/>
			</div>

			{/* Noise overlay */}
			<div
				className="absolute inset-0 opacity-15 dark:opacity-8 mix-blend-overlay"
				style={{
					backgroundImage:
						"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
				}}
			/>

			<div className="absolute inset-0 bg-linear-to-t from-transparent to-white/10 dark:to-black/20" />
		</div>
	);
}
