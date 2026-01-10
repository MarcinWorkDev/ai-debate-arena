import type { Avatar } from '../../lib/types/avatar'
import { AvatarCard } from './AvatarCard'

interface AvatarListProps {
  avatars: Avatar[]
  showOwner: boolean
  emptyMessage: string
  selectedAvatarId?: string | null
  onAvatarSelect?: (avatarId: string | null) => void
}

export function AvatarList({ 
  avatars, 
  showOwner, 
  emptyMessage,
  selectedAvatarId,
  onAvatarSelect 
}: AvatarListProps) {
  if (avatars.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {avatars.map((avatar) => (
        <AvatarCard
          key={avatar.id}
          avatar={avatar}
          showOwner={showOwner}
          onClick={() => onAvatarSelect?.(avatar.id)}
        />
      ))}
    </div>
  )
}
