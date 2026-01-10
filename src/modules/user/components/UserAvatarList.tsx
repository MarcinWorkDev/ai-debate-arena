import { useState } from 'react'
import { AvatarList } from '../../../shared/avatars/AvatarList'
import { AvatarForm } from '../../../shared/avatars/AvatarForm'
import { AvatarDetailModal } from '../../../shared/avatars/AvatarDetailModal'
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <AvatarList
          avatars={avatars}
          showOwner={false}
          emptyMessage="You haven't created any avatars yet. Click 'Create Avatar' to get started!"
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

