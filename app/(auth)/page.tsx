import { Background } from "@/components/custom/shared/Background";
import { LoginForm } from "@/components/forms/LoginForm";
import { ModeToggle } from "@/components/custom/theme/ModeToggle";

export default function AuthPage() {
	return (
		<div className="relative flex min-h-dvh items-center justify-center p-4">
			<Background />
			<div className="absolute inset-x-0 top-0 flex justify-end p-4 sm:p-6">
				<ModeToggle />
			</div>
			<div className="relative z-10 w-full max-w-md">
				<LoginForm />
			</div>
		</div>
	);
}
