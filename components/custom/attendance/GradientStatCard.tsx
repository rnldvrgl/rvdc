import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface GradientStatCardProps {
	title: string;
	value: number | string;
	subtitle: string;
	icon: LucideIcon;
	gradientFrom: string;
	gradientTo: string;
	borderColor: string;
	iconBgColor: string;
	iconColor: string;
	titleColor: string;
	valueColor: string;
	subtitleColor: string;
	isLoading?: boolean;
}

export const GradientStatCard = ({
	title,
	value,
	subtitle,
	icon: Icon,
	gradientFrom,
	gradientTo,
	borderColor,
	iconBgColor,
	iconColor,
	titleColor,
	valueColor,
	subtitleColor,
	isLoading = false,
}: GradientStatCardProps) => {
	return (
		<Card
			className={`bg-linear-to-br ${gradientFrom} ${gradientTo} ${borderColor} hover:shadow-lg transition-all duration-300`}
		>
			<CardContent>
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-2">
						<div className={`p-1.5 rounded-md ${iconBgColor}`}>
							<Icon
								className={`h-3.5 w-3.5 md:h-4 md:w-4 ${iconColor}`}
							/>
						</div>
						<p
							className={`text-xs md:text-sm font-medium ${titleColor}`}
						>
							{title}
						</p>
					</div>
					<p
						className={`text-2xl md:text-3xl font-bold ${valueColor}`}
					>
						{isLoading ? "..." : value}
					</p>
					<p className={`text-xs ${subtitleColor} mt-1`}>
						{subtitle}
					</p>
				</div>
			</CardContent>
		</Card>
	);
};
