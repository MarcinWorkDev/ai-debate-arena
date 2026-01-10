interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'red' | 'purple' | 'yellow'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 border-2',
  md: 'w-12 h-12 border-4',
  lg: 'w-16 h-16 border-4',
}

const colorClasses = {
  blue: 'border-slate-700 border-t-blue-500',
  red: 'border-red-500 border-t-transparent',
  purple: 'border-purple-500 border-t-transparent',
  yellow: 'border-yellow-500 border-t-transparent',
}

export function LoadingSpinner({ size = 'md', color = 'blue', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin`} />
    </div>
  )
}

