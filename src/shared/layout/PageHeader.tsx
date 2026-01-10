import { ReactNode } from 'react'

interface PageHeaderProps {
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl' | 'full'
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

export function PageHeader({ children, maxWidth = '7xl' }: PageHeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800">
      <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 py-4`}>
        {children}
      </div>
    </header>
  )
}

