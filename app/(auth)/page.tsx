import { Background } from "@/components/custom/shared/Background";
import { LoginForm } from "@/components/forms/LoginForm";
import { ModeToggle } from "@/components/custom/theme/ModeToggle";

export default function AuthPage() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4 relative">
			<Background />
			<ModeToggle className="absolute right-10 top-8" />
			<div className="relative z-10 w-full max-w-md">
				<LoginForm />
			</div>
		</div>
	);
}
