import { useEffect, useState } from 'react'
import { useAvatars } from '../../../hooks/useAvatars'
import { AvatarList } from '../../../shared/avatars/AvatarList'
import { AvatarDetailModal } from '../../../shared/avatars/AvatarDetailModal'
import { BlockAvatarModal } from './BlockAvatarModal'
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner'
import type { Avatar } from '../../../lib/types/avatar'

export function AdminAvatarList() {
  const { allAvatars, loading, loadAllAvatars, unblockAvatar } = useAvatars()
  const [blockingAvatar, setBlockingAvatar] = useState<Avatar | null>(null)
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadAllAvatars()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <AvatarList
          avatars={allAvatars}
          showOwner={true}
          emptyMessage="No avatars found."
          selectedAvatarId={selectedAvatarId}
          onAvatarSelect={setSelectedAvatarId}
        />
      )}

      {/* Avatar Detail Modal */}
      {selectedAvatarId && (
        <AvatarDetailModal
          avatarId={selectedAvatarId}
          onClose={() => setSelectedAvatarId(null)}
        />
      )}

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
