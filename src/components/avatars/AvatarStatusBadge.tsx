import type { Avatar } from '../../lib/types/avatar'

interface AvatarStatusBadgeProps {
  avatar: Avatar
}

export function AvatarStatusBadge({ avatar }: AvatarStatusBadgeProps) {
  // Blocked status takes priority
  if (avatar.status === 'blocked') {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
        Blocked
      </span>
    )
  }

  // Promotion status
  if (avatar.promotionStatus === 'pending') {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
        Pending Approval
      </span>
    )
  }

  if (avatar.promotionStatus === 'rejected') {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-400">
        Rejected
      </span>
    )
  }

  // Visibility
  if (avatar.visibility === 'public') {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
        Public
      </span>
    )
  }

  return (
    <span className="px-2 py-1 text-xs rounded-full bg-slate-500/20 text-slate-400">
      Private
    </span>
  )
}
