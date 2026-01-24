"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { PasswordField } from "@/components/custom/inputs/PasswordInput";
import { Spinner } from "@/components/custom/shared/Spinner";
import { ModeToggle } from "@/components/custom/theme/ModeToggle";
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
import { useRouter } from "next/navigation";
import { Lock, Snowflake, Shield, Zap } from "lucide-react";

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

			// Save to client-side if you still need it (Zustand, etc.)
			setToken("access", access);
			setToken("refresh", refresh);
			setToken("remember", values.remember_me ? "true" : "false");

			// Set HTTP-only cookies
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
		<div className="w-full max-w-md mx-auto space-y-6">
			<div className="text-center space-y-4">
				<div className="mx-auto w-20 h-20 bg-linear-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25 relative">
					<div className="absolute inset-2 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
						<Snowflake className="w-8 h-8 text-white" />
					</div>
				</div>
				<div className="space-y-2">
					<h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
						RVDC
					</h1>
					<p className="text-sm text-muted-foreground leading-relaxed">
						Refrigeration & Air Conditioning
					</p>
					<p className="text-xs text-muted-foreground/80">
						Professional Repair Management System
					</p>
				</div>
			</div>

			{/* Main Login Card */}
			<Card className="shadow-lg border-slate-200 dark:border-slate-800">
				<CardHeader className="text-center">
					<div className="flex items-center justify-between">
						<div className="flex-1">
							<h2 className="text-xl font-semibold text-foreground"></h2>
							<p className="text-sm text-muted-foreground mt-1">
								Access your service management dashboard
							</p>
						</div>
						<ModeToggle className="rounded-xl hover:scale-105 transition-transform" />
					</div>

					{/* Service Areas Badge */}
					<div className="flex flex-wrap justify-center gap-2">
						<div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
							<Snowflake className="w-3 h-3" />
							Refrigeration
						</div>
						<div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-100/80 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-full text-xs font-medium">
							<Zap className="w-3 h-3" />
							HVAC
						</div>
					</div>

					{/* Security Badge */}
					<div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
						<Shield className="w-3 h-3" />
						Secure Technician Portal
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
											<Input
												placeholder="Enter your username"
												autoFocus
												disabled={isSubmitting}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="relative">
								<PasswordField
									name="password"
									placeholder="Enter your password"
									disabled={isSubmitting}
									label="Password"
									required
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
													<label className="text-sm text-muted-foreground cursor-pointer">
														Remember me
													</label>
												</div>
												<button
													type="button"
													className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
												>
													Need help?
												</button>
											</div>
										</FormControl>
									</FormItem>
								)}
							/>

							<Button
								type="submit"
								className="w-full"
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<div className="flex items-center gap-2">
										<Spinner className="w-4 h-4" />
										<span>Signing in...</span>
									</div>
								) : (
									<div className="flex items-center gap-2">
										<Lock className="w-4 h-4" />
										<span>Sign In</span>
									</div>
								)}
							</Button>
						</form>
					</Form>

					{/* Security Badge */}
					<div className="flex justify-center pt-2">
						<div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
							<Shield className="w-3 h-3" />
							Secure Access
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
