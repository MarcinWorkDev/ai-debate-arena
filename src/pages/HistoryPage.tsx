import { useAuth } from '../hooks/useAuth'
import { DebateHistory } from '../components/debates/DebateHistory'

export function HistoryPage() {
  const { profile, logout } = useAuth()

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
