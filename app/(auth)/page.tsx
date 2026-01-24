import { Background } from "@/components/custom/shared/Background";
import { LoginForm } from "@/components/forms/LoginForm";

export default function AuthPage() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<Background />
			<LoginForm />
		</div>
	);
}
