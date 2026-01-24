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
		<Card
			className="
      container
         w-full max-w-md mx-auto
        rounded-3xl
        ring-1 dark:ring-foreground/10
        border border-border/40
        bg-linear-to-br from-background/80 to-background/60
        backdrop-blur-lg
        shadow-[0_10px_30px_rgba(0,0,0,0.25)]
        hover:shadow-[0_12px_36px_rgba(0,0,0,0.3)]
        dark:shadow-[0_10px_30px_rgba(255,255,255,0.08)]
        dark:hover:shadow-[0_12px_36px_rgba(255,255,255,0.1)]
        transition-shadow
      "
		>
			<CardHeader className="text-center space-y-1">
				<ModeToggle className="rounded-full absolute top-3 right-3 hover:scale-110 transition-transform" />

				<h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
					Welcome Back
				</h2>

				<p className="text-xs sm:text-sm text-muted-foreground">
					Sign in to continue
				</p>
			</CardHeader>

			<CardContent className="text-sm sm:text-base">
				<Form {...form}>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-5"
					>
						<FormField
							control={control}
							name="username"
							render={({ field }) => (
								<FormItem>
									<FormLabel required>Username</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter your username"
											autoFocus
											disabled={isSubmitting}
											className="focus-visible:ring-2 focus-visible:ring-primary"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<PasswordField
							name="password"
							placeholder="••••••••"
							disabled={isSubmitting}
							label="Password"
						/>

						<FormField
							control={control}
							name="remember_me"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<div className="flex items-center gap-2">
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
												disabled={isSubmitting}
											/>
											<span className="text-xs sm:text-sm leading-none">
												Remember Me
											</span>
										</div>
									</FormControl>
								</FormItem>
							)}
						/>

						<Button
							className="w-full rounded-xl mt-2 text-sm sm:text-base"
							disabled={isSubmitting}
						>
							{isSubmitting ? <Spinner /> : "Sign In"}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
