import { useState, useMemo } from 'react'
import { AvatarList } from '../../../shared/avatars/AvatarList'
import { AvatarForm } from '../../../shared/avatars/AvatarForm'
import { AvatarDetailModal } from '../../../shared/avatars/AvatarDetailModal'
import { TagFilter } from '../../../shared/ui/TagFilter'
import { useAvatars } from '../../../hooks/useAvatars'
import type { Avatar } from '../../../lib/types/avatar'

interface UserAvatarListProps {
  avatars: Avatar[]
  loading: boolean
  onRefresh: () => void
}

export function UserAvatarList({ avatars, loading, onRefresh }: UserAvatarListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">My Avatars</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Create Avatar
        </button>
      </div>

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
          showOwner={false}
          emptyMessage={
            selectedTags.length > 0
              ? "No avatars match the selected tags."
              : "You haven't created any avatars yet. Click 'Create Avatar' to get started!"
          }
          selectedAvatarId={selectedAvatarId}
          onAvatarSelect={setSelectedAvatarId}
        />
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <AvatarForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            onRefresh()
          }}
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

