import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import type { Debate } from '../../../lib/db'

interface DebateHeaderProps {
  debate: Debate
  messageCount: number
  showBackLink?: boolean
  backLinkTo?: string
  backLinkLabel?: string
  showNewDebateButton?: boolean
  isPublic?: boolean
}

export function DebateHeader({
  debate,
  messageCount,
  showBackLink = true,
  backLinkTo,
  backLinkLabel = '← Back',
  showNewDebateButton = false,
  isPublic = false,
}: DebateHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      // Fallback if no history
      navigate(backLinkTo || '/user')
    }
  }

  return (
    <header className="bg-slate-900 border-b border-slate-800 flex-shrink-0">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {!isPublic && (
          <div className="flex items-center justify-between mb-4">
            {showBackLink && (
              <button
                onClick={handleBack}
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                {backLinkLabel}
              </button>
            )}
            {showNewDebateButton && debate.status === 'finished' && (
              <Link
                to="/"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
              >
                New Debate
              </Link>
            )}
          </div>
        )}
        {isPublic && (
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <span>AI Debate Arena</span>
            <span>/</span>
            <span>Public Debate</span>
          </div>
        )}
        <h1 className="text-2xl font-bold text-white">{debate.title}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
          <StatusBadge status={debate.status} type="debate" />
          {!isPublic && <span>{debate.creditsUsed} credits</span>}
          {!isPublic && <span>{debate.roundCount} / {debate.maxRounds} rounds</span>}
          <span>{debate.createdAt.toLocaleDateString()}</span>
          <span>{messageCount} messages</span>
        </div>
      </div>
    </header>
  )
}

