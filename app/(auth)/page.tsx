import { Background } from '@/components/custom/shared/Background'
import { LoginForm } from '@/components/forms/LoginForm'

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Background />
      <LoginForm />
    </main>
  )
}
