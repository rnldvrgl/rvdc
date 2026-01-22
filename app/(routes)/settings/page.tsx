"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Settings, User as UserIcon, Shield } from "lucide-react";

import Loader from "@/app/loading";
import UserProfileForm from "@/components/forms/UserProfileForm";
import PageHeader from "@/components/custom/shared/PageHeader";
import { Wrapper } from "@/components/custom/shared/Wrapper";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { userProfileSchema } from "@/lib/constants/schema";
import { TUserProfile, UserProfilePayload } from "@/lib/constants/types";
import { User } from "@/lib/constants/interface";
import useFileUpload from "@/lib/hooks/useFileUpload";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useUserProfile } from "@/lib/queries/useUserProfile";
import useUserProfileStore from "@/lib/store/useUserProfileStore";
import { normalizeProfileImage } from "@/lib/utils/helpers";
import { formatDate } from "@/lib/utils/helpers/date";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw, RotateCcw } from "lucide-react";
import { useProfileSettingMutations } from "@/lib/mutations/useProfileSettingMutations";
import { ConfirmAlert } from "@/components/custom/shared/ConfirmAlert";

/* -------------------------------- helpers -------------------------------- */

function mapProfileToForm(profile: User | null): TUserProfile {
	return {
		email: profile?.email ?? "",
		username: profile?.username ?? "",
		first_name: profile?.first_name ?? "",
		last_name: profile?.last_name ?? "",
		contact_number: profile?.contact_number ?? "",
		new_password: "",
		current_password: "",
		birthday: profile?.birthday ? new Date(profile.birthday) : undefined,
		profile_image: profile?.profile_image ?? "",
	};
}

type EditableField =
	| "first_name"
	| "last_name"
	| "username"
	| "email"
	| "contact_number";

function buildProfilePayload(
	values: TUserProfile,
	current: User | null,
): Partial<UserProfilePayload> {
	if (!current) return {};

	const payload: Partial<UserProfilePayload> = {};

	const fields: EditableField[] = [
		"first_name",
		"last_name",
		"username",
		"email",
		"contact_number",
	];

	for (const field of fields) {
		if (values[field] !== current[field]) {
			payload[field] = values[field];
		}
	}

	const formattedBirthday = values.birthday
		? formatDate(values.birthday)
		: null;

	const currentBirthday = current.birthday ? String(current.birthday) : null;

	if (formattedBirthday !== currentBirthday) {
		payload.birthday = formattedBirthday || undefined;
	}

	const normalizedImage = normalizeProfileImage(values.profile_image);
	if (
		(normalizedImage === "" && current.profile_image) ||
		(normalizedImage && normalizedImage !== current.profile_image)
	) {
		payload.profile_image = normalizedImage;
	}

	if (values.new_password) payload.new_password = values.new_password;
	if (values.current_password)
		payload.current_password = values.current_password;

	return payload;
}

function getChangeSummary(
	values: TUserProfile,
	current: User | null,
): string[] {
	if (!current) return [];

	const changes: string[] = [];
	const payload = buildProfilePayload(values, current);

	if (payload.first_name) changes.push(`First Name: "${values.first_name}"`);
	if (payload.last_name) changes.push(`Last Name: "${values.last_name}"`);
	if (payload.username) changes.push(`Username: "${values.username}"`);
	if (payload.email) changes.push(`Email: "${values.email}"`);
	if (payload.contact_number)
		changes.push(`Contact Number: "${values.contact_number}"`);
	if (payload.birthday)
		changes.push(
			`Birthday: "${values.birthday ? new Date(values.birthday).toLocaleDateString() : "Not set"}"`,
		);
	if (payload.profile_image !== undefined) changes.push("Profile Image");
	if (payload.new_password) changes.push("Password");

	return changes;
}

/* ------------------------------- component -------------------------------- */

export default function SettingsPage() {
	const { isAdmin } = useCurrentUser();
	const { data, isLoading, refetch } = useUserProfile();
	const { updateUserProfile } = useProfileSettingMutations();

	// State for confirm dialog
	const [showResetConfirm, setShowResetConfirm] = useState(false);

	const setUserProfile = useUserProfileStore((s) => s.setUserProfile);
	const userProfile = useUserProfileStore((s) => s.userProfile);

	const form = useForm<TUserProfile>({
		resolver: zodResolver(userProfileSchema),
		mode: "onChange",
		defaultValues: mapProfileToForm(userProfile),
	});

	// Track if there are any changes
	const watchedValues = form.watch();
	const hasChanges = userProfile
		? Object.keys(buildProfilePayload(watchedValues, userProfile)).length >
			0
		: false;

	// Track form state for better UX
	const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

	useEffect(() => {
		if (data) setUserProfile(data);
	}, [data, setUserProfile]);

	useEffect(() => {
		form.reset(mapProfileToForm(userProfile));
	}, [userProfile, form]);

	const upload = useFileUpload({
		form,
		fieldName: "profile_image",
		initialImage: userProfile?.profile_image,
	});

	async function onSubmit(values: TUserProfile) {
		const payload = buildProfilePayload(values, userProfile);

		if (!Object.keys(payload).length) {
			toast.error("No changes to save.");
			return;
		}

		try {
			const response = await updateUserProfile.mutateAsync(payload);
			// The mutation response should contain the updated user data
			const updatedUser = response.data || response;
			setUserProfile(updatedUser);
			form.reset(mapProfileToForm(updatedUser));
			setLastSaveTime(new Date());
			await refetch();
		} catch (err) {
			// The useApiMutation hook already handles basic error display
			// We just add some specific handling for common cases
			console.error("Profile update error:", err);
		}
	}

	const handleResetClick = () => {
		if (hasChanges) {
			setShowResetConfirm(true);
		} else {
			performReset();
		}
	};

	// Get summary of changes for confirmation dialog
	const changeSummary = getChangeSummary(watchedValues, userProfile);

	const performReset = () => {
		form.reset(mapProfileToForm(userProfile));
		toast.success("Form reset to original values.");
		setShowResetConfirm(false);
	};

	const handleRefresh = async () => {
		try {
			await refetch();
			toast.success("Profile data refreshed successfully.");
		} catch {
			toast.error("Failed to refresh profile data.");
		}
	};

	if (isLoading) return <Loader />;

	return (
		<Wrapper>
			<PageHeader
				icon={Settings}
				title="Account Settings"
				description="Manage your personal information, security settings, and account preferences."
				variant="default"
				theme="default"
				breadcrumbs={["Dashboard", "Settings"]}
				isAdminOnly={!isAdmin}
			/>

			{/* Action Bar */}
			<div className="flex justify-between items-center mb-6">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					{lastSaveTime && (
						<span>
							Last saved: {lastSaveTime.toLocaleTimeString()}
						</span>
					)}
				</div>
				<div className="flex gap-2">
					<Button
						variant="destructive"
						size="sm"
						onClick={handleResetClick}
						disabled={!hasChanges || updateUserProfile.isPending}
					>
						<RotateCcw className="size-4 mr-2" />
						Reset Changes
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleRefresh}
						disabled={isLoading}
					>
						<RefreshCw
							className={`size-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
				</div>
			</div>

			<Card className="overflow-hidden">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<UserIcon className="size-5" />
						Profile Information
					</CardTitle>
					<CardDescription>
						Update your personal details and account settings
					</CardDescription>
				</CardHeader>
				<CardContent>
					{userProfile && (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
							<Info label="Full Name">
								{userProfile.first_name} {userProfile.last_name}
							</Info>
							<Info label="Username">{userProfile.username}</Info>
							<Info label="Email Address">
								{userProfile.email || "Not provided"}
							</Info>
							<Info label="Contact Number">
								{userProfile.contact_number || "Not provided"}
							</Info>
							<Info label="Role">
								{userProfile.role ? (
									<span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
										<Shield className="size-3" />
										{userProfile.role[0].toUpperCase() +
											userProfile.role.slice(1)}
									</span>
								) : (
									"No role assigned"
								)}
							</Info>
							<Info label="Birthday">
								{userProfile.birthday
									? new Date(
											userProfile.birthday,
										).toLocaleDateString()
									: "Not provided"}
							</Info>
						</div>
					)}
				</CardContent>
			</Card>

			<Card className="overflow-hidden">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="size-5" />
						Edit Profile
					</CardTitle>
					<CardDescription>
						Update your account information and change your password
					</CardDescription>
				</CardHeader>
				<CardContent>
					<UserProfileForm
						form={form}
						onSubmit={onSubmit}
						upload={upload}
						hasChanges={hasChanges}
						isSubmitting={updateUserProfile.isPending}
					/>
				</CardContent>
			</Card>

			{/* Reset Confirmation Dialog */}
			<ConfirmAlert
				open={showResetConfirm}
				onOpenChange={setShowResetConfirm}
				onConfirm={performReset}
				title="Reset Profile Changes?"
				description={
					changeSummary.length > 0
						? `You will lose the following changes: ${changeSummary.join(", ")}. This action cannot be undone.`
						: "You have unsaved changes to your profile. Resetting will restore all fields to their original values and cannot be undone."
				}
				confirmText="Reset Changes"
				cancelText="Keep Editing"
				confirmVariant="destructive"
				isConfirming={updateUserProfile.isPending}
			/>
		</Wrapper>
	);
}

/* ---------------------------- small ui helper ----------------------------- */

function Info({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<label className="text-sm font-medium text-muted-foreground">
				{label}
			</label>
			<p className="text-base font-medium">{children}</p>
		</div>
	);
}
