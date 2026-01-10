import { useEffect, useState } from 'react'
import { useAvatars } from '../../../hooks/useAvatars'
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { TabNavigation, type Tab } from '../../../shared/layout/TabNavigation'
import { AvatarDetailModal } from '../../../shared/avatars/AvatarDetailModal'

type RequestType = 'promotions' | 'suggestions' | 'unblock'

export function AdminChangeRequests() {
  const {
    pendingPromotions,
    pendingSuggestions,
    unblockRequests,
    loading,
    loadPendingPromotions,
    loadPendingSuggestions,
    loadUnblockRequests,
    approvePromotion,
    rejectPromotion,
    approveSuggestion,
    rejectSuggestion,
    unblockAvatar,
  } = useAvatars()

  const [activeTab, setActiveTab] = useState<RequestType>('promotions')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)

  useEffect(() => {
    loadPendingPromotions()
    loadPendingSuggestions()
    loadUnblockRequests()
  }, [loadPendingPromotions, loadPendingSuggestions, loadUnblockRequests])

  const handleApprovePromotion = async (avatarId: string) => {
    setActionLoading(avatarId)
    try {
      await approvePromotion(avatarId)
    } catch (err) {
      console.error('Failed to approve promotion:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectPromotion = async (avatarId: string) => {
    if (!rejectReason.trim()) return
    setActionLoading(avatarId)
    try {
      await rejectPromotion(avatarId, rejectReason)
      setRejectingId(null)
      setRejectReason('')
    } catch (err) {
      console.error('Failed to reject promotion:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleApproveSuggestion = async (suggestionId: string, avatarId: string) => {
    setActionLoading(suggestionId)
    try {
      await approveSuggestion(suggestionId, avatarId)
    } catch (err) {
      console.error('Failed to approve suggestion:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectSuggestion = async (suggestionId: string, avatarId: string) => {
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

  const handleUnblock = async (avatarId: string) => {
    setActionLoading(avatarId)
    try {
      await unblockAvatar(avatarId)
    } catch (err) {
      console.error('Failed to unblock avatar:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const tabs: Tab[] = [
    {
      id: 'promotions',
      label: 'Promotions',
      count: pendingPromotions.length,
      badgeColor: 'yellow',
    },
    {
      id: 'suggestions',
      label: 'Suggestions',
      count: pendingSuggestions.length,
      badgeColor: 'purple',
    },
    {
      id: 'unblock',
      label: 'Unblock Requests',
      count: unblockRequests.length,
      badgeColor: 'red',
    },
  ]

  if (loading) {
    return <LoadingSpinner size="sm" className="py-12" />
  }

  return (
    <>
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as RequestType)}
        maxWidth="full"
      />

      <div className="mt-6 space-y-4">
        {activeTab === 'promotions' && (
          <>
            {pendingPromotions.length === 0 ? (
              <EmptyState message="No pending promotion requests." />
            ) : (
              pendingPromotions.map((avatar) => (
                <div
                  key={avatar.id}
                  className="bg-slate-900 rounded-xl border border-slate-800 p-4"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex-shrink-0"
                      style={{ backgroundColor: avatar.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-lg font-medium text-white">{avatar.name}</h3>
                          <p className="text-sm text-slate-400">
                            by {avatar.authorEmail} | {avatar.model}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                          Pending
                        </span>
                      </div>

                      <p className="text-sm text-slate-300 mb-4 line-clamp-3">{avatar.persona}</p>

                      {avatar.promotionRequestedAt && (
                        <p className="text-xs text-slate-500 mb-4">
                          Requested: {avatar.promotionRequestedAt.toLocaleString()}
                        </p>
                      )}

                      {rejectingId === avatar.id ? (
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
                              onClick={() => handleRejectPromotion(avatar.id)}
                              disabled={!rejectReason.trim() || actionLoading === avatar.id}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg disabled:opacity-50"
                            >
                              {actionLoading === avatar.id ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprovePromotion(avatar.id)}
                            disabled={actionLoading === avatar.id}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionLoading === avatar.id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setRejectingId(avatar.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'suggestions' && (
          <>
            {pendingSuggestions.length === 0 ? (
              <EmptyState message="No pending suggestions to review." />
            ) : (
              pendingSuggestions.map((suggestion) => (
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
                          onClick={() => handleRejectSuggestion(suggestion.id, suggestion.avatarId)}
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
                        onClick={() => handleApproveSuggestion(suggestion.id, suggestion.avatarId)}
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
              ))
            )}
          </>
        )}

        {activeTab === 'unblock' && (
          <>
            {unblockRequests.length === 0 ? (
              <EmptyState message="No pending unblock requests." />
            ) : (
              unblockRequests.map((avatar) => (
                <div
                  key={avatar.id}
                  className="bg-slate-900 rounded-xl border border-slate-800 p-4"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex-shrink-0 opacity-50 cursor-pointer hover:opacity-75 transition-opacity"
                      style={{ backgroundColor: avatar.color }}
                      onClick={() => setSelectedAvatarId(avatar.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div>
                          <h3
                            className="text-lg font-medium text-white cursor-pointer hover:text-blue-400 transition-colors"
                            onClick={() => setSelectedAvatarId(avatar.id)}
                          >
                            {avatar.name}
                          </h3>
                          <p className="text-sm text-slate-400">by {avatar.authorEmail}</p>
                        </div>
                        <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full">
                          Blocked
                        </span>
                      </div>

                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-300">
                          <span className="text-red-400 font-medium">Blocked reason:</span>{' '}
                          {avatar.blockedReason}
                        </p>
                        <p className="text-xs text-red-300/70 mt-1">
                          Blocked by {avatar.blockedBy} on {avatar.blockedAt?.toLocaleDateString()}
                        </p>
                      </div>

                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                        <p className="text-sm text-yellow-300">
                          <span className="text-yellow-400 font-medium">Unblock request:</span>{' '}
                          {avatar.unblockRequestReason}
                        </p>
                        <p className="text-xs text-yellow-300/70 mt-1">
                          Requested on {avatar.unblockRequestedAt?.toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUnblock(avatar.id)}
                          disabled={actionLoading === avatar.id}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === avatar.id ? 'Unblocking...' : 'Unblock Avatar'}
                        </button>
                        <button
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Keep Blocked
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {selectedAvatarId && (
        <AvatarDetailModal
          avatarId={selectedAvatarId}
          onClose={() => setSelectedAvatarId(null)}
        />
      )}
    </>
  )
}

