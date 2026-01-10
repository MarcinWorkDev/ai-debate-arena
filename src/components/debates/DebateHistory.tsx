import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUserDebates, type Debate } from '../../lib/db'
import { useAuth } from '../../hooks/useAuth'
import { ShareToggle } from './ShareToggle'

export function DebateHistory() {
  const { user } = useAuth()
  const [debates, setDebates] = useState<Debate[]>([])
  const [loading, setLoading] = useState(true)

  const loadDebates = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getUserDebates(user.uid)
      setDebates(data)
    } catch (err) {
      console.error('Error loading debates:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDebates()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (debates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-slate-400">No debates yet. Start your first debate!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {debates.map((debate) => (
        <div
          key={debate.id}
          className="bg-slate-900 rounded-xl border border-slate-800 p-4 hover:border-slate-700 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <Link
              to={`/debate/${debate.id}`}
              className="flex-1 min-w-0 cursor-pointer"
            >
              <h3 className="text-white font-medium truncate hover:text-blue-400 transition-colors">
                {debate.title}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  debate.status === 'finished'
                    ? 'bg-green-500/20 text-green-400'
                    : debate.status === 'running'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {debate.status}
                </span>
                <span>{debate.creditsUsed} credits</span>
                <span>{debate.roundCount} / {debate.maxRounds} rounds</span>
                <span>{debate.createdAt.toLocaleDateString()}</span>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ShareToggle
                debateId={debate.id}
                isPublic={debate.isPublic}
                publicSlug={debate.publicSlug}
                onUpdate={loadDebates}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
