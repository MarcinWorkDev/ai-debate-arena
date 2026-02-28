import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getDebateBySlug, getMessages, type Debate, type DebateMessage } from '../../../lib/db'
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { DebateHeader } from '../components/DebateHeader'
import { DebateMessageList } from '../components/DebateMessageList'

export function PublicDebatePage() {
  const { slug } = useParams<{ slug: string }>()
  const [debate, setDebate] = useState<Debate | null>(null)
  const [messages, setMessages] = useState<DebateMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!slug) return
      setLoading(true)
      setError(null)

      try {
        const debateData = await getDebateBySlug(slug)
        if (!debateData) {
          setError('Debate not found or is not public')
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
  }, [slug])

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
            message={error || 'This debate does not exist or is not public.'}
            action={
              <a
                href="/"
                className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Go Home
              </a>
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
        showBackLink={false}
        isPublic={true}
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
                        {avatar.model && !avatar.isHuman && (
                          <span className="text-[10px] text-white/40 font-medium px-1.5 py-0.5 rounded bg-white/5">
                            {avatar.model}
                          </span>
                        )}
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
            <DebateMessageList messages={messages} showTokens={false} />
          </section>
        </div>
      </main>
    </div>
  )
}

