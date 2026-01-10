import { useEffect, useState } from 'react'
import { useAvatars } from '../../hooks/useAvatars'

export function PromotionRequestList() {
  const {
    pendingPromotions,
    loading,
    loadPendingPromotions,
    approvePromotion,
    rejectPromotion,
  } = useAvatars()

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    loadPendingPromotions()
  }, [loadPendingPromotions])

  const handleApprove = async (avatarId: string) => {
    setActionLoading(avatarId)
    try {
      await approvePromotion(avatarId)
    } catch (err) {
      console.error('Failed to approve promotion:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (avatarId: string) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (pendingPromotions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No pending promotion requests.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pendingPromotions.map((avatar) => (
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
                      onClick={() => handleReject(avatar.id)}
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
                    onClick={() => handleApprove(avatar.id)}
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
      ))}
    </div>
  )
}
