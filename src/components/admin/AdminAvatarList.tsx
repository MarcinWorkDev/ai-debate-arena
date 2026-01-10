import { useEffect, useState } from 'react'
import { useAvatars } from '../../hooks/useAvatars'
import { AvatarStatusBadge } from '../avatars/AvatarStatusBadge'
import { BlockAvatarModal } from './BlockAvatarModal'
import type { Avatar } from '../../lib/types/avatar'

export function AdminAvatarList() {
  const { allAvatars, loading, loadAllAvatars, unblockAvatar } = useAvatars()
  const [blockingAvatar, setBlockingAvatar] = useState<Avatar | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadAllAvatars()
  }, [loadAllAvatars])

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
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (allAvatars.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No avatars found.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Avatar
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Author
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Visibility
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {allAvatars.map((avatar) => (
              <tr key={avatar.id} className="hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: avatar.color }}
                    />
                    <div>
                      <p className="text-white font-medium">{avatar.name}</p>
                      <p className="text-xs text-slate-500">{avatar.model}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-slate-300">{avatar.authorEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <AvatarStatusBadge avatar={avatar} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      avatar.visibility === 'public'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {avatar.visibility}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">
                  {avatar.createdAt.toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {avatar.status === 'active' ? (
                      <button
                        onClick={() => setBlockingAvatar(avatar)}
                        className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                      >
                        Block
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnblock(avatar.id)}
                        disabled={actionLoading === avatar.id}
                        className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                      >
                        {actionLoading === avatar.id ? '...' : 'Unblock'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {blockingAvatar && (
        <BlockAvatarModal
          avatar={blockingAvatar}
          onClose={() => setBlockingAvatar(null)}
          onSuccess={() => {
            setBlockingAvatar(null)
            loadAllAvatars()
          }}
        />
      )}
    </>
  )
}
