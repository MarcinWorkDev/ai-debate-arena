import { ReactNode } from 'react'
import { PageHeader } from './PageHeader'

interface PageLayoutProps {
  children: ReactNode
  header?: ReactNode
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

export function PageLayout({ children, header, maxWidth = '7xl' }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950">
      {header && <PageHeader>{header}</PageHeader>}
      <main className={`${maxWidthClasses[maxWidth]} mx-auto px-4 py-6`}>
        {children}
      </main>
    </div>
  )
}

