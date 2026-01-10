import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title?: string
  message: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, message, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      )}
      <p className="text-slate-400">{message}</p>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}

