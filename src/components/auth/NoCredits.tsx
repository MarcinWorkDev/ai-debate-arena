import { useAuth } from '../../hooks/useAuth'

export function NoCredits() {
  const { profile, logout, refreshProfile, loading, isAdmin } = useAuth()

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="w-full max-w-md p-8 bg-slate-900 rounded-xl border border-slate-800 shadow-xl text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">No Credits Available</h1>
        <p className="text-slate-400 mb-2">
          Hi {profile?.displayName || 'there'}! You've used all your available credits.
        </p>
        <p className="text-slate-500 text-sm mb-6">
          Credits used: {profile?.creditsUsed || 0} | Available: {profile?.creditsAvailable || 0}
        </p>

        <div className="space-y-3">
          {isAdmin && (
            <a
              href="/admin"
              className="block w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              Go to Admin Panel
            </a>
          )}
          <button
            onClick={refreshProfile}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check for New Credits'}
          </button>
          <button
            onClick={logout}
            className="w-full px-4 py-2 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
