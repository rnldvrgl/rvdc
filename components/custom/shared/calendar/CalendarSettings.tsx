"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings, Calendar, Check } from "lucide-react";
import { useCalendarPreferences } from "@/lib/hooks/useCalendarPreferences";

interface CalendarSettingsProps {
	trigger?: React.ReactNode;
	className?: string;
}

const CalendarSettings = ({ trigger, className }: CalendarSettingsProps) => {
	const { preferences, setWeekStartsOn, isLoaded } = useCalendarPreferences();
	const [isOpen, setIsOpen] = useState(false);
	const [tempWeekStartsOn, setTempWeekStartsOn] = useState<0 | 1>(
		preferences.weekStartsOn,
	);

	// Update temp value when preferences change
	React.useEffect(() => {
		setTempWeekStartsOn(preferences.weekStartsOn);
	}, [preferences.weekStartsOn]);

	const handleSave = () => {
		setWeekStartsOn(tempWeekStartsOn);
		setIsOpen(false);
	};

	const handleCancel = () => {
		setTempWeekStartsOn(preferences.weekStartsOn);
		setIsOpen(false);
	};

	const defaultTrigger = (
		<Button variant="outline" size="sm" className={className}>
			<Settings className="h-4 w-4 mr-2" />
			Calendar Settings
		</Button>
	);

	if (!isLoaded) {
		return null;
	}

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5" />
						Calendar Settings
					</DialogTitle>
					<DialogDescription>
						Customize how your calendar is displayed
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-base">
								Week Start Day
							</CardTitle>
						</CardHeader>
						<CardContent>
							<RadioGroup
								value={tempWeekStartsOn.toString()}
								onValueChange={(value: string) =>
									setTempWeekStartsOn(
										parseInt(value) as 0 | 1,
									)
								}
								className="space-y-3"
							>
								<div className="flex items-center space-x-2">
									<RadioGroupItem
										value="0"
										id="sunday"
										className="mt-0.5"
									/>
									<Label
										htmlFor="sunday"
										className="flex-1 cursor-pointer"
									>
										<div className="flex items-center justify-between">
											<div>
												<div className="font-medium">
													Sunday
												</div>
												<div className="text-sm text-muted-foreground">
													Week starts on Sunday
												</div>
											</div>
											{tempWeekStartsOn === 0 && (
												<Check className="h-4 w-4 text-primary" />
											)}
										</div>
									</Label>
								</div>

								<div className="flex items-center space-x-2">
									<RadioGroupItem
										value="1"
										id="monday"
										className="mt-0.5"
									/>
									<Label
										htmlFor="monday"
										className="flex-1 cursor-pointer"
									>
										<div className="flex items-center justify-between">
											<div>
												<div className="font-medium">
													Monday
												</div>
												<div className="text-sm text-muted-foreground">
													Week starts on Monday (ISO
													standard)
												</div>
											</div>
											{tempWeekStartsOn === 1 && (
												<Check className="h-4 w-4 text-primary" />
											)}
										</div>
									</Label>
								</div>
							</RadioGroup>

							<div className="mt-4 p-3 bg-muted/50 rounded-lg">
								<p className="text-sm text-muted-foreground">
									<strong>Preview:</strong> With{" "}
									{tempWeekStartsOn === 0
										? "Sunday"
										: "Monday"}{" "}
									as the first day, your weekly calendar will
									show{" "}
									{tempWeekStartsOn === 0
										? "Sun-Sat"
										: "Mon-Sun"}{" "}
									layout.
								</p>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="flex justify-end space-x-2">
					<Button variant="outline" onClick={handleCancel}>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						disabled={tempWeekStartsOn === preferences.weekStartsOn}
					>
						Save Changes
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default CalendarSettings;
