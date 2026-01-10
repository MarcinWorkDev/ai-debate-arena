import { useState } from 'react'
import { AvatarList } from '../../../shared/avatars/AvatarList'
import { AvatarDetailModal } from '../../../shared/avatars/AvatarDetailModal'
import type { Avatar } from '../../../lib/types/avatar'

interface PublicAvatarListProps {
  avatars: Avatar[]
  loading: boolean
}

export function PublicAvatarList({ avatars, loading }: PublicAvatarListProps) {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)

  return (
    <>
      <h2 className="text-lg font-semibold text-white mb-6">Public Avatars</h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <AvatarList
          avatars={avatars}
          showOwner={true}
          emptyMessage="No public avatars available yet."
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

