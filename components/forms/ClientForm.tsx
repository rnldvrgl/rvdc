"use client";

import { usePsgcForm } from "@/lib/hooks/usePsgcForm";
import { useClientMutations } from "@/lib/mutations/useClientMutations";
import { SubmitHandler, useForm } from "react-hook-form";

import type { PsgcSelectProps } from "@/components/custom/inputs/PsgcSelect";
import { PsgcSelect } from "@/components/custom/inputs/PsgcSelect";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Client } from "@/lib/constants/types";

function LocationField({
	name,
	label,
	value,
	options,
	onChange,
	loading,
	disabled,
	placeholder,
	control,
	required,
}: PsgcSelectProps<FormValues>) {
	return (
		<FormField
			control={control}
			name={name}
			rules={required ? { required: `${label} is required` } : {}}
			render={() => (
				<PsgcSelect
					required={required}
					control={control}
					name={name}
					label={label}
					value={value}
					options={options}
					onChange={onChange}
					placeholder={placeholder}
					loading={loading}
					disabled={disabled}
				/>
			)}
		/>
	);
}

interface FormValues {
	full_name: string;
	contact_number?: string;
	address?: string;
	province: string;
	city: string;
	barangay?: string;
	is_blocklisted: boolean;
}

interface ClientFormProps {
	client?: Client;
	onClose: () => void;
}

export default function ClientForm({ client, onClose }: ClientFormProps) {
	const form = useForm<FormValues>({
		defaultValues: {
			full_name: client?.full_name ?? "",
			contact_number: client?.contact_number ?? "",
			address: client?.address ?? "",
			province: client?.province ?? "",
			city: client?.city ?? "",
			barangay: client?.barangay ?? "",
			is_blocklisted: client?.is_blocklisted ?? false,
		},
	});

	const {
		selectedProvince,
		selectedCity,
		selectedBarangay,
		sortedProvinces,
		sortedCities,
		sortedBarangays,
		loadingProvinces,
		loadingCities,
		loadingBarangays,
		provinceName,
		cityName,
		barangayName,
		handleProvinceChange,
		handleCityChange,
		handleBarangayChange,
	} = usePsgcForm<FormValues>({ form, defaultValues: client });

	const { addClient, updateClient } = useClientMutations();

	const handleSubmit: SubmitHandler<FormValues> = (data) => {
		const payload = {
			...data,
			province: provinceName,
			city: cityName,
			barangay: barangayName,
			contact_number: data.contact_number?.trim() || null,
			address: data.address?.trim() || null,
		};

		if (client?.id) {
			updateClient.mutate(
				{ id: client.id, data: payload },
				{
					onSuccess: onClose,
				},
			);
		} else {
			addClient.mutate(payload, {
				onSuccess: onClose,
			});
		}
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className="space-y-6 max-w-md"
			>
				<div className="space-y-4 grid">
					<FormField
						control={form.control}
						name="full_name"
						rules={{ required: "Full name is required" }}
						render={({ field }) => (
							<FormItem>
								<FormLabel required>Client Full Name</FormLabel>
								<FormControl>
									<Input
										className="uppercase"
										{...field}
										placeholder="Juan Dela Cruz"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="contact_number"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Contact Number</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="09XX XXX XXXX"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="address"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Address</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="Street, Subdivision, etc."
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<LocationField
						name="province"
						label="Province"
						required
						value={selectedProvince ?? ""}
						options={sortedProvinces}
						onChange={handleProvinceChange}
						placeholder="Select Province"
						loading={loadingProvinces}
						control={form.control}
					/>

					<LocationField
						name="city"
						label="City / Municipality"
						required
						value={selectedCity ?? ""}
						options={sortedCities}
						onChange={handleCityChange}
						placeholder="Select City/Municipality"
						loading={loadingCities}
						disabled={!selectedProvince}
						control={form.control}
					/>

					<LocationField
						name="barangay"
						label="Barangay"
						value={selectedBarangay ?? ""}
						options={sortedBarangays}
						onChange={handleBarangayChange}
						placeholder="Select Barangay"
						loading={loadingBarangays}
						disabled={!selectedCity}
						control={form.control}
					/>

					<FormField
						control={form.control}
						name="is_blocklisted"
						render={({ field }) => (
							<FormItem className="flex items-center justify-between rounded-lg border p-3">
								<FormLabel required>Blocklisted</FormLabel>
								<FormControl>
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
				</div>

				<div className="pt-4 flex justify-end">
					<Button type="submit">Save Client</Button>
				</div>
			</form>
		</Form>
	);
}
