import { useRef, useEffect } from 'react'
import { useDebateStore } from '../../stores/debateStore'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'

export function ChatPanel() {
  const messages = useDebateStore((state) => state.messages)
  const activeAgent = useDebateStore((state) => state.activeAgent)
  const currentStreamingContent = useDebateStore((state) => state.currentStreamingContent)
  const status = useDebateStore((state) => state.status)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, currentStreamingContent])

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-800/50 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-100 font-semibold text-base">Debate Log</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
              {messages.length} messages
            </span>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  status === 'running'
                    ? 'bg-emerald-500 animate-pulse'
                    : status === 'paused'
                    ? 'bg-amber-500'
                    : status === 'finished'
                    ? 'bg-sky-500'
                    : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-400 text-xs font-medium">
                {status === 'running' && 'In progress...'}
                {status === 'paused' && 'Paused'}
                {status === 'finished' && 'Finished'}
                {status === 'idle' && 'Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin 
                   scrollbar-thumb-white/20 scrollbar-track-transparent"
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Streaming message */}
        {activeAgent && currentStreamingContent && (
          <div>
            <MessageBubble
              message={{
                id: 'streaming',
                agentId: activeAgent.id,
                agentName: activeAgent.name,
                agentColor: activeAgent.color,
                agentModel: activeAgent.model,
                content: currentStreamingContent,
                timestamp: Date.now(),
                isStreaming: true,
              }}
            />
          </div>
        )}

        {/* Typing indicator */}
        {status === 'running' && activeAgent && !currentStreamingContent && (
          <TypingIndicator agent={activeAgent} />
        )}
        
        {/* Empty state */}
        {status === 'idle' && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
            <p>Enter a topic and start the debate</p>
          </div>
        )}
      </div>
    </div>
  )
}
