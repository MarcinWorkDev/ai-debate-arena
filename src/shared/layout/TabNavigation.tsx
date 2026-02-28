import { Link } from 'react-router-dom'

export interface Tab {
  id: string
  label: string
  count?: number
  badgeColor?: 'blue' | 'yellow' | 'purple' | 'red' | 'green'
}

interface TabNavigationProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl' | 'full'
  basePath?: string
}

const maxWidthClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

const badgeColorClasses = {
  blue: 'bg-blue-500/20 text-blue-400',
  yellow: 'bg-yellow-500/20 text-yellow-400',
  purple: 'bg-purple-500/20 text-purple-400',
  red: 'bg-red-500/20 text-red-400',
  green: 'bg-green-500/20 text-green-400',
}

const activeTabColorClasses = {
  blue: 'border-blue-500 text-blue-400',
  yellow: 'border-yellow-500 text-yellow-400',
  purple: 'border-purple-500 text-purple-400',
  red: 'border-red-500 text-red-400',
  green: 'border-green-500 text-green-400',
}

export function TabNavigation({ tabs, activeTab, onTabChange, maxWidth = '7xl', basePath }: TabNavigationProps) {
  const getTabUrl = (tabId: string) => {
    if (!basePath) return '#'
    // Always include query param
    return `${basePath}?tab=${tabId}`
  }

  return (
    <div className="bg-slate-900 border-b border-slate-800">
      <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4`}>
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const badgeColor = tab.badgeColor || 'blue'
            const activeColor = isActive ? activeTabColorClasses[badgeColor] : ''
            
            if (basePath) {
              return (
                <Link
                  key={tab.id}
                  to={getTabUrl(tab.id)}
                  onClick={(e) => {
                    e.preventDefault()
                    onTabChange(tab.id)
                  }}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    isActive
                      ? activeColor
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${badgeColorClasses[badgeColor]}`}>
                      {tab.count}
                    </span>
                  )}
                </Link>
              )
            }
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? activeColor
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${badgeColorClasses[badgeColor]}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

