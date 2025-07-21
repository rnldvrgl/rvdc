import { Background } from '@/components/custom/shared/Background'
import { LoginForm } from '@/components/forms/LoginForm'

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center  px-4 py-8 sm:px-6 lg:px-8">
      <Background />
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  )
}
