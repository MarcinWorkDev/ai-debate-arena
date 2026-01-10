import { useEffect, useState } from 'react'
import { useAvatars } from '../../hooks/useAvatars'
import { AvatarDetailModal } from '../avatars/AvatarDetailModal'

export function UnblockRequestList() {
  const {
    unblockRequests,
    loading,
    loadUnblockRequests,
    unblockAvatar,
  } = useAvatars()

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)

  useEffect(() => {
    loadUnblockRequests()
  }, [loadUnblockRequests])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (unblockRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No pending unblock requests.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {unblockRequests.map((avatar) => (
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

                {/* Block info */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-300">
                    <span className="text-red-400 font-medium">Blocked reason:</span>{' '}
                    {avatar.blockedReason}
                  </p>
                  <p className="text-xs text-red-300/70 mt-1">
                    Blocked by {avatar.blockedBy} on {avatar.blockedAt?.toLocaleDateString()}
                  </p>
                </div>

                {/* Unblock request */}
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
        ))}
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
