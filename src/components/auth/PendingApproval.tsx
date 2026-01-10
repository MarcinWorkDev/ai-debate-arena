import { useAuth } from '../../hooks/useAuth'

export function PendingApproval() {
  const { profile, logout, refreshProfile, loading } = useAuth()

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="w-full max-w-md p-8 bg-slate-900 rounded-xl border border-slate-800 shadow-xl text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Awaiting Approval</h1>
        <p className="text-slate-400 mb-6">
          Hi {profile?.displayName || 'there'}! Your account is pending admin approval.
          You'll be able to start debating once approved.
        </p>

        <div className="space-y-3">
          <button
            onClick={refreshProfile}
            disabled={loading}
            className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Status'}
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
