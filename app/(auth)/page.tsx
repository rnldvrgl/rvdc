import { LoginForm } from '@/components/forms/LoginForm'
import { SHOP_INFO } from '@/lib/constants/meta'
import Image from 'next/image'

export default function HomePage() {
  const { name, description } = SHOP_INFO
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
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
          <div className="text-center text-background px-8">
            <h1 className="text-4xl font-bold mb-4">{name}</h1>
            <p className="text-lg max-w-md mx-auto">{description}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
