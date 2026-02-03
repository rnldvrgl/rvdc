import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { FolderCode, LucideIcon } from "lucide-react";

export function EmptyWrapper({
	icon: Icon,
	title = "Empty",
	description = "You're all caught up.",
	action,
	content,
}: {
	icon?: LucideIcon;
	title?: string;
	description?: string;
	action?: React.ReactNode;
	content?: React.ReactNode;
}) {
	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					{Icon ? <Icon /> : <FolderCode />}
				</EmptyMedia>
				<EmptyTitle>{title}</EmptyTitle>
				<EmptyDescription>{description}</EmptyDescription>
			</EmptyHeader>
			{content && (
				<EmptyContent className="flex-row justify-center gap-2">
					{content}
				</EmptyContent>
			)}
			{action && action}
		</Empty>
	);
}
