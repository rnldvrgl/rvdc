import { LucideIcon } from "lucide-react";
import React from "react";

const PageHeader = ({
	icon: Icon,
	title,
	subtitle,
	isAdminOnly,
}: {
	icon?: LucideIcon;
	title?: string;
	subtitle?: string;
	isAdminOnly?: boolean;
}) => {
	return (
		<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-4 sm:p-6 lg:p-8 shadow-xl">
			<div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
			<div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div className="space-y-2 flex-1 min-w-0">
					<div className="flex items-center gap-3">
						{Icon && (
							<div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-xl flex-shrink-0">
								<Icon className="size-6 sm:size-8 text-white" />
							</div>
						)}
						<div className="min-w-0 flex-1">
							<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight truncate">
								{title}
							</h1>
							{subtitle && (
								<p className="text-blue-100 mt-1 text-sm sm:text-base line-clamp-2">
									{subtitle}
								</p>
							)}
						</div>
					</div>
				</div>
				{isAdminOnly && (
					<div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs sm:text-sm font-medium border border-white/20 flex-shrink-0 self-start sm:self-auto">
						Admin Access
					</div>
				)}
			</div>
		</div>
	);
};

export default PageHeader;
