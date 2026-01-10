import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getDebate, getMessages, type Debate, type DebateMessage } from '../lib/db'
import { useAuth } from '../hooks/useAuth'

export function ViewDebatePage() {
  const { id } = useParams<{ id: string }>()
  const { user, profile } = useAuth()
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
  }, [id, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !debate) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Not Found</h1>
          <p className="text-slate-400">{error || 'This debate does not exist.'}</p>
          <Link
            to="/history"
            className="inline-block mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Back to History
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/history"
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              ← Back to History
            </Link>
            {debate.status === 'finished' && (
              <Link
                to="/"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
              >
                New Debate
              </Link>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">{debate.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
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
            <span>{messages.length} messages</span>
          </div>
        </div>
      </header>

      {/* Messages - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className="bg-slate-900 rounded-xl border border-slate-800 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: message.avatarColor }}
                  />
                  <span className="text-white font-medium">{message.avatarName}</span>
                  <span className="text-slate-500 text-xs">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  {(message.tokensUsed > 0 || message.inputTokens > 0 || message.outputTokens > 0) && (
                    <div className="flex items-center gap-2 ml-auto text-xs">
                      {message.inputTokens > 0 && (
                        <span className="text-blue-400" title="Input tokens">
                          In: {message.inputTokens}
                        </span>
                      )}
                      {message.outputTokens > 0 && (
                        <span className="text-green-400" title="Output tokens">
                          Out: {message.outputTokens}
                        </span>
                      )}
                      {message.reasoningTokens > 0 && (
                        <span className="text-purple-400" title="Reasoning tokens">
                          Reason: {message.reasoningTokens}
                        </span>
                      )}
                      {message.tokensUsed > 0 && (
                        <span className="text-slate-500" title="Total tokens">
                          Total: {message.tokensUsed}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-slate-300 text-base leading-relaxed prose prose-base prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-headings:text-slate-100 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-strong:text-white prose-em:text-slate-300 prose-code:text-pink-400 prose-code:bg-slate-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded prose-pre:p-3 prose-pre:my-2 prose-hr:border-slate-700 prose-table:my-4 prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-slate-600 prose-th:bg-slate-800 prose-th:p-3 prose-th:text-left prose-th:font-semibold prose-th:text-slate-200 prose-td:border prose-td:border-slate-700 prose-td:p-3 prose-td:text-slate-300 prose-tr:hover:bg-slate-800/30">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Tables - custom styling
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full border-collapse border border-slate-600">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => <thead className="bg-slate-800">{children}</thead>,
                      tbody: ({ children }) => <tbody>{children}</tbody>,
                      tr: ({ children }) => (
                        <tr className="border-b border-slate-700 hover:bg-slate-800/30">
                          {children}
                        </tr>
                      ),
                      th: ({ children }) => (
                        <th className="border border-slate-600 px-3 py-2 text-left font-semibold text-slate-200 bg-slate-800">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-slate-700 px-3 py-2 text-slate-300">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>

          {messages.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No messages in this debate yet.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

