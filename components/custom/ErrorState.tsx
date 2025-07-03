import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowRightToLine, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export function ErrorState({
  title = 'Something went wrong',
  description,
  retry,
}: {
  title?: string
  description?: string
  retry?: () => void
}) {
  return (
    <div className="h-full py-8 px-4 grid place-items-center">
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <AlertTriangle className="size-10 text-destructive" />
        <h2 className="text-xl font-semibold text-destructive">{title}</h2>
        {description && (
          <p className="text-muted-foreground max-w-md">{description}</p>
        )}
        <div className="flex gap-4 mt-4">
          <Button
            asChild
            className="group"
          >
            <Link href="/">
              Go back home
              <ArrowRightToLine className="size-5 duration-300 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          {retry && (
            <Button
              variant="destructive"
              onClick={retry}
              className="flex items-center gap-2 group"
            >
              <RefreshCw className="size-4 duration-700 transition-transform group-hover:rotate-90" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
