type StatusType = 'debate' | 'avatar' | 'user'

interface StatusBadgeProps {
  status: string
  type?: StatusType
  className?: string
}

// Debate statuses: 'finished', 'running', 'idle', 'paused'
// Avatar statuses: 'approved', 'pending', 'blocked'
// User statuses: 'approved', 'pending', 'blocked'

const statusColors: Record<string, { bg: string; text: string }> = {
  // Debate statuses
  finished: { bg: 'bg-green-500/20', text: 'text-green-400' },
  running: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  idle: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
  paused: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
  
  // Avatar/User statuses
  approved: { bg: 'bg-green-500/20', text: 'text-green-400' },
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  blocked: { bg: 'bg-red-500/20', text: 'text-red-400' },
}

export function StatusBadge({ status, type = 'debate', className = '' }: StatusBadgeProps) {
  const colors = statusColors[status.toLowerCase()] || statusColors.idle
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${colors.bg} ${colors.text} ${className}`}>
      {status}
    </span>
  )
}

