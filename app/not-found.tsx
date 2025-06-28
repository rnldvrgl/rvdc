import { Button } from '@/components/ui/button'
import { ArrowRightToLine } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Link
        href="/"
        className="mb-2 text-lg font-semibold text-primary"
      >
        RVDC Ref & Aircon Repair Shop
      </Link>

      <p className="text-6xl font-bold text-primary">404</p>

      <h1 className="mt-4 text-2xl font-semibold text-foreground">
        Page not found
      </h1>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Sorry, we couldn’t find the page you’re looking for. It might have been
        removed, renamed, or did not exist in the first place.
      </p>

      <Button
        asChild
        className="mt-8 group"
      >
        <Link href="/">
          Go back home
          <ArrowRightToLine className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>
  )
}
