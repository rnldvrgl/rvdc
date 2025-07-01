import React from 'react'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'border-primary' | 'border-secondary' | 'border-destructive' | string
  overlayColor?: string
}

const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  color = 'border-primary',
  overlayColor = 'bg-background/80', // semi-transparent overlay
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${overlayColor}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 ${color} border-t-transparent shadow`}
      ></div>
    </div>
  )
}

export default Loader
