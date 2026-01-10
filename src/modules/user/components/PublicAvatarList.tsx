import { useState, useMemo } from 'react'
import { AvatarList } from '../../../shared/avatars/AvatarList'
import { AvatarDetailModal } from '../../../shared/avatars/AvatarDetailModal'
import { TagFilter } from '../../../shared/ui/TagFilter'
import type { Avatar } from '../../../lib/types/avatar'

interface PublicAvatarListProps {
  avatars: Avatar[]
  loading: boolean
}

export function PublicAvatarList({ avatars, loading }: PublicAvatarListProps) {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Filter avatars by selected tags
  const filteredAvatars = useMemo(() => {
    if (selectedTags.length === 0) {
      return avatars
    }
    return avatars.filter((avatar) => {
      if (!avatar.tags || avatar.tags.length === 0) {
        return false
      }
      // Avatar must have at least one of the selected tags
      return selectedTags.some((tag) => avatar.tags?.includes(tag))
    })
  }, [avatars, selectedTags])

  return (
    <>
      <h2 className="text-lg font-semibold text-white mb-6">Public Avatars</h2>

      {!loading && avatars.length > 0 && (
        <div className="mb-6">
          <TagFilter
            avatars={avatars}
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
              : "No public avatars available yet."
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
    </>
  )
}

