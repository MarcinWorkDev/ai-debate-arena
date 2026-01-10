import { useEffect, useState, useMemo } from 'react'
import { useAvatars } from '../../../hooks/useAvatars'
import { AvatarList } from '../../../shared/avatars/AvatarList'
import { AvatarDetailModal } from '../../../shared/avatars/AvatarDetailModal'
import { TagFilter } from '../../../shared/ui/TagFilter'
import { BlockAvatarModal } from './BlockAvatarModal'
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner'
import type { Avatar } from '../../../lib/types/avatar'

export function AdminAvatarList() {
  const { allAvatars, loading, loadAllAvatars, unblockAvatar } = useAvatars()
  const [blockingAvatar, setBlockingAvatar] = useState<Avatar | null>(null)
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Filter avatars by selected tags
  const filteredAvatars = useMemo(() => {
    if (selectedTags.length === 0) {
      return allAvatars
    }
    return allAvatars.filter((avatar) => {
      if (!avatar.tags || avatar.tags.length === 0) {
        return false
      }
      // Avatar must have at least one of the selected tags
      return selectedTags.some((tag) => avatar.tags?.includes(tag))
    })
  }, [allAvatars, selectedTags])

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
      {!loading && allAvatars.length > 0 && (
        <div className="mb-6">
          <TagFilter
            avatars={allAvatars}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <AvatarList
          avatars={filteredAvatars}
          showOwner={true}
          emptyMessage={
            selectedTags.length > 0
              ? "No avatars match the selected tags."
              : "No avatars found."
          }
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
