import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon, Lock } from "lucide-react";
import React, { createElement, useState } from "react";
import { useFormContext } from "react-hook-form";

type PasswordFieldProps = {
	name?: string;
	placeholder?: string;
	description?: string | React.ReactNode;
	disabled?: boolean;
	label?: string;
	required?: boolean;
	className?: string;
	showIcon?: boolean;
};

export function PasswordField({
	name = "password",
	placeholder = "Enter password",
	description,
	disabled,
	label,
	required,
	className,
	showIcon = true,
}: PasswordFieldProps) {
	const { control, getFieldState } = useFormContext();
	const [passwordVisibility, setPasswordVisibility] = useState(false);

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					{label && (
						<FormLabel required={required}>{label}</FormLabel>
					)}
					<FormControl>
						<Box className="relative">
							{showIcon && (
								<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
							)}
							<Input
								{...field}
								disabled={disabled}
								value={field.value ?? ""}
								type={passwordVisibility ? "text" : "password"}
								autoComplete="on"
								placeholder={placeholder}
								aria-invalid={
									!!getFieldState(name).error || undefined
								}
								className={`pr-12 ${showIcon ? "pl-10" : ""} ${className || ""}`}
							/>
							<Button
								disabled={disabled}
								type="button"
								variant="plain"
								className="absolute inset-y-0 right-0 flex items-center p-3 text-muted-foreground"
								onClick={() =>
									setPasswordVisibility(!passwordVisibility)
								}
							>
								{createElement(
									passwordVisibility ? EyeOffIcon : EyeIcon,
									{
										className: "size-6",
									},
								)}
							</Button>
						</Box>
					</FormControl>
					<FormMessage />
					{description && (
						<FormDescription>{description}</FormDescription>
					)}
				</FormItem>
			)}
		/>
	);
}
