import type { Avatar } from '../../lib/types/avatar'
import { AvatarStatusBadge } from './AvatarStatusBadge'

interface AvatarCardProps {
  avatar: Avatar
  showOwner: boolean
  onClick: () => void
}

export function AvatarCard({ avatar, showOwner, onClick }: AvatarCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClick()
  }

  return (
    <div
      onClick={handleClick}
      className="bg-slate-900 rounded-xl border border-slate-800 p-4 hover:border-slate-700 cursor-pointer transition-all hover:shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Color indicator */}
          <div
            className="w-10 h-10 rounded-full flex-shrink-0"
            style={{ backgroundColor: avatar.color }}
          />
          <div>
            <h3 className="text-white font-medium">{avatar.name}</h3>
            <p className="text-xs text-slate-500">{avatar.model}</p>
          </div>
        </div>
        <AvatarStatusBadge avatar={avatar} />
      </div>

      {/* Persona preview */}
      <p className="text-sm text-slate-400 line-clamp-3 mb-3">{avatar.persona}</p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        {showOwner && <span>{avatar.authorEmail}</span>}
        {avatar.forkedFromName && (
          <span className="text-slate-600">Forked from: {avatar.forkedFromName}</span>
        )}
        {!showOwner && !avatar.forkedFromName && <span />}
        <span>{avatar.createdAt ? new Date(avatar.createdAt).toLocaleDateString() : ''}</span>
      </div>
    </div>
  )
}
