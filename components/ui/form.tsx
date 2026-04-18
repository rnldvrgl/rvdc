"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import {
	Controller,
	FormProvider,
	useFormContext,
	useFormState,
	type ControllerProps,
	type FieldPath,
	type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils/helpers";

const Form = FormProvider;

type FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
	name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(
	null,
);

interface FormLabelProps extends React.ComponentProps<
	typeof LabelPrimitive.Root
> {
	required?: boolean;
}

const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	...props
}: ControllerProps<TFieldValues, TName>) => {
	return (
		<FormFieldContext.Provider value={{ name: props.name }}>
			<Controller {...props} />
		</FormFieldContext.Provider>
	);
};

const useFormField = () => {
	const fieldContext = React.useContext(FormFieldContext);
	const itemContext = React.useContext(FormItemContext);
	const formContext = useFormContext();
	const fieldName = fieldContext?.name;
	const formState = useFormState({
		control: formContext?.control,
		name: fieldName,
	});
	const fieldState =
		formContext && fieldName
			? formContext.getFieldState(fieldName, formState)
			: {
				invalid: false,
				isDirty: false,
				isTouched: false,
				isValidating: false,
				error: undefined,
			};

	const id = itemContext?.id ?? "form-item";

	return {
		id,
		name: fieldName,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	};
};

type FormItemContextValue = {
	id: string;
};

const FormItemContext = React.createContext<FormItemContextValue | null>(
	null,
);

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
	const id = React.useId();

	return (
		<FormItemContext.Provider value={{ id }}>
			<div
				data-slot="form-item"
				className={cn("grid gap-1.5 sm:gap-2", className)}
				{...props}
			/>
		</FormItemContext.Provider>
	);
}

function FormLabel({
	className,
	required,
	children,
	...props
}: FormLabelProps) {
	const { error, formItemId } = useFormField();

	return (
		<LabelPrimitive.Root
			data-slot="form-label"
			data-error={!!error}
			className={cn(
				"data-[error=true]:text-destructive font-semibold uppercase tracking-wide text-[11px] sm:text-xs md:text-sm",
				className,
			)}
			htmlFor={formItemId}
			{...props}
		>
			{children}
			{required && <span className="text-destructive ml-0.5">*</span>}
		</LabelPrimitive.Root>
	);
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
	const { error, formItemId, formDescriptionId, formMessageId } =
		useFormField();

	return (
		<Slot
			data-slot="form-control"
			id={formItemId}
			aria-describedby={
				!error
					? `${formDescriptionId}`
					: `${formDescriptionId} ${formMessageId}`
			}
			aria-invalid={!!error}
			{...props}
		/>
	);
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
	const { formDescriptionId } = useFormField();

	return (
		<p
			data-slot="form-description"
			id={formDescriptionId}
			className={cn("text-muted-foreground text-xs sm:text-sm", className)}
			{...props}
		/>
	);
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
	const { error, formMessageId } = useFormField();
	const body = error ? String(error?.message ?? "") : props.children;
	return (
		<div className="min-h-4 sm:min-h-5">
			<p
				data-slot="form-message"
				id={formMessageId}
				className={cn("text-destructive text-[11px] sm:text-sm", className)}
				{...props}
			>
				{body}
			</p>
		</div>
	);
}

export {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	useFormField,
};
