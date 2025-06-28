import { LoginForm } from '@/components/forms/LoginForm'
import Image from 'next/image'

export default function HomePage() {
  return (
    <main className="min-h-screen grid grid-cols-1 xl:grid-cols-2">
      {/* Right section with background image or color */}
      <div className="flex min-h-screen items-center justify-center bg-muted p-6">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>

      {/* Right side: login */}
      <div className="relative hidden xl:block h-full w-full">
        <Image
          src="/bg.jpg"
          alt="Service Background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
          <div className="text-center text-background px-8">
            <h1 className="text-4xl font-bold mb-4">RVDC Ref & Aircon</h1>
            <p className="text-lg max-w-md mx-auto">
              Reliable refrigeration and air conditioning services for your home
              and business.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
