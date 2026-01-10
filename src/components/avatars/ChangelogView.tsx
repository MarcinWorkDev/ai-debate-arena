import type { AvatarChangelog } from '../../lib/types/avatar'

interface ChangelogViewProps {
  changelog: AvatarChangelog[]
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  created: { label: 'Created', color: 'text-green-400' },
  updated: { label: 'Updated', color: 'text-blue-400' },
  promoted_request: { label: 'Promotion Requested', color: 'text-yellow-400' },
  promoted_approved: { label: 'Promotion Approved', color: 'text-green-400' },
  promoted_rejected: { label: 'Promotion Rejected', color: 'text-red-400' },
  blocked: { label: 'Blocked', color: 'text-red-400' },
  unblocked: { label: 'Unblocked', color: 'text-green-400' },
  unblock_requested: { label: 'Unblock Requested', color: 'text-yellow-400' },
  suggestion_submitted: { label: 'Suggestion Submitted', color: 'text-purple-400' },
  suggestion_approved: { label: 'Suggestion Approved', color: 'text-green-400' },
  suggestion_rejected: { label: 'Suggestion Rejected', color: 'text-red-400' },
  forked: { label: 'Forked', color: 'text-cyan-400' },
}

export function ChangelogView({ changelog }: ChangelogViewProps) {
  if (changelog.length === 0) {
    return <p className="text-slate-400 text-center py-4">No changelog entries yet.</p>
  }

  return (
    <div className="space-y-3">
      {changelog.map((entry) => {
        const actionInfo = ACTION_LABELS[entry.action] || { label: entry.action, color: 'text-slate-400' }

        return (
          <div
            key={entry.id}
            className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`font-medium ${actionInfo.color}`}>{actionInfo.label}</span>
              <span className="text-xs text-slate-500">
                {entry.timestamp.toLocaleString()}
              </span>
            </div>

            <p className="text-sm text-slate-400">by {entry.actorEmail}</p>

            {entry.changes && entry.changes.length > 0 && (
              <div className="mt-2 text-sm">
                {entry.changes.map((change, idx) => (
                  <div key={idx} className="text-slate-300">
                    <span className="text-slate-500">{change.field}:</span>{' '}
                    <span className="text-red-400 line-through">{change.oldValue || '(empty)'}</span>
                    {' → '}
                    <span className="text-green-400">{change.newValue || '(empty)'}</span>
                  </div>
                ))}
              </div>
            )}

            {entry.reason && (
              <p className="mt-2 text-sm text-slate-400">
                <span className="text-slate-500">Reason:</span> {entry.reason}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
