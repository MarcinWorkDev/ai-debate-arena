import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { DebateHistory } from '../components/debates/DebateHistory'

export function HistoryPage() {
  const { profile, logout } = useAuth()

  // Enable scrolling on history page
  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return

    // Add classes
    document.documentElement.classList.add('admin-page')
    document.body.classList.add('admin-page')
    
    // Directly set styles to ensure scrolling works
    document.documentElement.style.overflow = 'auto'
    document.documentElement.style.height = 'auto'
    document.documentElement.style.minHeight = '100%'
    
    document.body.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.body.style.minHeight = '100%'
    
    root.style.overflow = 'auto'
    root.style.height = 'auto'
    root.style.minHeight = '100%'

    return () => {
      document.documentElement.classList.remove('admin-page')
      document.body.classList.remove('admin-page')
      
      // Reset styles
      document.documentElement.style.overflow = ''
      document.documentElement.style.height = ''
      document.documentElement.style.minHeight = ''
      
      document.body.style.overflow = ''
      document.body.style.height = ''
      document.body.style.minHeight = ''
      
      root.style.overflow = ''
      root.style.height = ''
      root.style.minHeight = ''
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">My Debates</h1>
            <p className="text-sm text-slate-400">View and share your debate history</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-white text-sm">{profile?.displayName}</div>
              <div className="text-slate-400 text-xs">
                {profile?.creditsAvailable} credits available
              </div>
            </div>
            <a
              href="/"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
            >
              New Debate
            </a>
            {profile?.isAdmin && (
              <a
                href="/admin"
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
              >
                Admin
              </a>
            )}
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <DebateHistory />
      </main>
    </div>
  )
}
