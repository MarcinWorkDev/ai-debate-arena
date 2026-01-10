import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { getDebate, getMessages, type Debate, type DebateMessage } from '../../../lib/db'
import { useAuth } from '../../../hooks/useAuth'
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { DebateHeader } from '../components/DebateHeader'
import { DebateMessageList } from '../components/DebateMessageList'

export function ViewDebatePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const fromAdmin = searchParams.get('from') === 'admin'
  const [debate, setDebate] = useState<Debate | null>(null)
  const [messages, setMessages] = useState<DebateMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      setError(null)

      try {
        const debateData = await getDebate(id)
        if (!debateData) {
          setError('Debate not found')
          return
        }

        // Check if user owns this debate or is admin
        const isAdmin = profile?.isAdmin ?? false
        if (debateData.userId !== user?.uid && !isAdmin) {
          setError('You do not have permission to view this debate')
          return
        }

        setDebate(debateData)
        const messagesData = await getMessages(debateData.id)
        setMessages(messagesData)
      } catch (err) {
        console.error('Error loading debate:', err)
        setError('Failed to load debate')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, user, profile])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (error || !debate) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <EmptyState
            icon={
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            title="Not Found"
            message={error || 'This debate does not exist.'}
            action={
              <button
                onClick={() => window.history.length > 1 ? window.history.back() : navigate(fromAdmin ? "/admin" : "/user")}
                className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Back
              </button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      <DebateHeader
        debate={debate}
        messageCount={messages.length}
        showBackLink={true}
        backLinkTo={fromAdmin ? "/admin" : "/user"}
        backLinkLabel="← Back"
        showNewDebateButton={true}
      />

      {/* Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
          {/* Participants Section */}
          {debate.avatarsSnapshot && debate.avatarsSnapshot.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">
                {debate.language === 'pl' ? 'Uczestnicy' : 'Participants'}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {debate.avatarsSnapshot
                  .filter(avatar => !avatar.isModerator)
                  .map((avatar, index) => (
                    <div
                      key={avatar.avatarId || `avatar-${index}`}
                      className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: avatar.color }}
                        />
                        <h3 className="text-lg font-semibold text-white">
                          {avatar.name}
                        </h3>
                        {avatar.isHuman && (
                          <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                            {debate.language === 'pl' ? 'Użytkownik' : 'User'}
                          </span>
                        )}
                      </div>
                      {avatar.persona && (
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {avatar.persona}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Messages Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">
              {debate.language === 'pl' ? 'Przebieg debaty' : 'Debate Transcript'}
            </h2>
            <DebateMessageList messages={messages} showTokens={true} isAdmin={profile?.isAdmin ?? false} />
          </section>
        </div>
      </main>
    </div>
  )
}

