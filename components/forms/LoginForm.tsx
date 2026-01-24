"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Snowflake, Shield, ArrowRight, User } from "lucide-react";

import { PasswordField } from "@/components/custom/inputs/PasswordInput";
import { Spinner } from "@/components/custom/shared/Spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/constants/schema";
import { LoginFormValues } from "@/lib/constants/types";
import { useDRFToastError } from "@/lib/hooks/useDRFToastError";
import useUserProfileStore from "@/lib/store/useUserProfileStore";
import api from "@/lib/utils/api";
import { setToken } from "@/lib/utils/tokens";

export function LoginForm() {
	const router = useRouter();
	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			username: "",
			password: "",
			remember_me: true,
		},
	});

	const { handleSubmit, control, formState } = form;
	const { isSubmitting } = formState;
	const setUserProfile = useUserProfileStore((state) => state.setUserProfile);
	const { handleError } = useDRFToastError();

	const onSubmit = async (values: LoginFormValues) => {
		try {
			const response = await api.post("/auth/login/", values);

			const { access, refresh, role } = response.data;

			setToken("access", access);
			setToken("refresh", refresh);
			setToken("remember", values.remember_me ? "true" : "false");

			const cookieRes = await fetch("/api/set-cookie", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ access, refresh, role }),
				credentials: "include",
			});

			if (!cookieRes.ok) {
				throw new Error("Failed to set auth cookies");
			}

			setUserProfile(response.data);

			await new Promise((res) => setTimeout(res, 200));

			router.push("/dashboard");

			toast.success(`Welcome back, ${response.data.first_name}!`);
		} catch (err: unknown) {
			handleError(err);
		}
	};

	return (
		<div className="w-full space-y-6">
			{/* Brand Header */}
			<div className="text-center space-y-4">
				<div className="mx-auto w-20 h-20 bg-linear-to-br from-purple-500 via-violet-500 to-purle-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25 relative overflow-hidden">
					<div className="absolute inset-2 bg-white/5 rounded-xl flex items-center justify-center backdrop-blur-sm">
						<Snowflake className="w-6 h-6 text-white" />
					</div>
				</div>
				<div className="space-y-2">
					<h1 className="text-3xl font-bold bg-linear-to-r from-purple-600 via-violet-600 to-purple-700 bg-clip-text text-transparent">
						RVDC
					</h1>
					<p className="text-sm text-muted-foreground leading-relaxed">
						Refrigeration & Air Conditioning Services
					</p>
				</div>
			</div>

			{/* Main Login Card */}
			<Card className="shadow-lg border-slate-200 dark:border-slate-800">
				<CardHeader className="text-center">
					<div className="flex items-center justify-between mb-3">
						<div className="flex-1">
							<h2 className="text-lg font-semibold text-foreground">
								Sign In
							</h2>
							<p className="text-xs text-muted-foreground mt-0.5">
								Access your dashboard
							</p>
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-4">
					<Form {...form}>
						<form
							onSubmit={handleSubmit(onSubmit)}
							className="space-y-4"
						>
							<FormField
								control={control}
								name="username"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-sm font-medium">
											Username
										</FormLabel>
										<FormControl>
											<div className="relative">
												<User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
												<Input
													placeholder="Enter your username"
													className="pl-10 pr-4"
													autoFocus
													disabled={isSubmitting}
													{...field}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="space-y-2">
								<PasswordField
									name="password"
									placeholder="Enter your password"
									disabled={isSubmitting}
									label="Password"
								/>
							</div>

							<FormField
								control={control}
								name="remember_me"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													<Checkbox
														checked={field.value}
														onCheckedChange={
															field.onChange
														}
														disabled={isSubmitting}
													/>
													<label className="text-sm text-muted-foreground cursor-pointer select-none">
														Keep me signed in
													</label>
												</div>
											</div>
										</FormControl>
									</FormItem>
								)}
							/>

							<Button
								type="submit"
								className="w-full bg-linear-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-medium py-2.5 transition-all duration-200 shadow-md hover:shadow-lg"
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<div className="flex items-center gap-2">
										<Spinner className="w-4 h-4" />
										<span>Signing in...</span>
									</div>
								) : (
									<div className="flex items-center gap-2">
										<span>Sign In to Dashboard</span>
										<ArrowRight className="w-4 h-4" />
									</div>
								)}
							</Button>
						</form>
					</Form>

					{/* Security Footer */}
					<div className="pt-4 border-t border-gray-200 dark:border-gray-700">
						<div className="flex items-center justify-center gap-2">
							<Shield className="w-4 h-4 text-green-600" />
							<span className="text-xs text-muted-foreground">
								Your connection is secure and encrypted
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
