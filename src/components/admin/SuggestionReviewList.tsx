import { useEffect, useState } from 'react'
import { useAvatars } from '../../hooks/useAvatars'

export function SuggestionReviewList() {
  const {
    pendingSuggestions,
    loading,
    loadPendingSuggestions,
    approveSuggestion,
    rejectSuggestion,
  } = useAvatars()

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    loadPendingSuggestions()
  }, [loadPendingSuggestions])

  const handleApprove = async (suggestionId: string, avatarId: string) => {
    setActionLoading(suggestionId)
    try {
      await approveSuggestion(suggestionId, avatarId)
    } catch (err) {
      console.error('Failed to approve suggestion:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (suggestionId: string, avatarId: string) => {
    if (!rejectReason.trim()) return
    setActionLoading(suggestionId)
    try {
      await rejectSuggestion(suggestionId, avatarId, rejectReason)
      setRejectingId(null)
      setRejectReason('')
    } catch (err) {
      console.error('Failed to reject suggestion:', err)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (pendingSuggestions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No pending suggestions to review.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pendingSuggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className="bg-slate-900 rounded-xl border border-slate-800 p-4"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-medium text-white">
                Suggestion for: {suggestion.avatarName}
              </h3>
              <p className="text-sm text-slate-400">by {suggestion.submitterEmail}</p>
            </div>
            <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-full">
              Pending
            </span>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Suggested Changes:</h4>
            <div className="space-y-2 text-sm">
              {Object.entries(suggestion.suggestedChanges).map(([field, value]) => (
                <div key={field}>
                  <span className="text-slate-500">{field}:</span>{' '}
                  <span className="text-blue-400">{value as string}</span>
                </div>
              ))}
            </div>
          </div>

          {suggestion.submissionReason && (
            <div className="mb-4">
              <p className="text-sm text-slate-400">
                <span className="text-slate-500">Reason:</span> {suggestion.submissionReason}
              </p>
            </div>
          )}

          <p className="text-xs text-slate-500 mb-4">
            Submitted: {suggestion.createdAt.toLocaleString()}
          </p>

          {rejectingId === suggestion.id ? (
            <div className="space-y-3">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder-slate-500 resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setRejectingId(null)
                    setRejectReason('')
                  }}
                  className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(suggestion.id, suggestion.avatarId)}
                  disabled={!rejectReason.trim() || actionLoading === suggestion.id}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg disabled:opacity-50"
                >
                  {actionLoading === suggestion.id ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(suggestion.id, suggestion.avatarId)}
                disabled={actionLoading === suggestion.id}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === suggestion.id ? 'Applying...' : 'Approve & Apply'}
              </button>
              <button
                onClick={() => setRejectingId(suggestion.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
