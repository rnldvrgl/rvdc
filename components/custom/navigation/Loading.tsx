import clsx from 'clsx'

type LoadingProps = {
  text?: string
  size?: 'sm' | 'md' | 'lg'
  centerScreen?: boolean
  className?: string
}

export default function Loading({
  text = 'Loading...',
  size = 'md',
  centerScreen = false,
  className = '',
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-4',
    lg: 'h-16 w-16 border-4',
  }

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-3',
        centerScreen ? 'h-screen' : 'py-10',
        className,
      )}
    >
      <div
        className={clsx(
          'animate-spin rounded-full border-t-transparent border-primary  shadow-lg transition-transform duration-300 hover:scale-110',
          sizeClasses[size],
        )}
      />
      {text && (
        <span className="text-muted-foreground animate-pulse text-sm">
          {text}
        </span>
      )}
    </div>
  )
}
