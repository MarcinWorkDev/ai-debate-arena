import { useRef, useEffect, useState } from 'react'
import { useDebateStore } from '../../stores/debateStore'
import { useDebate } from '../../hooks/useDebate'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'

export function ChatPanel() {
  const messages = useDebateStore((state) => state.messages)
  const activeAgent = useDebateStore((state) => state.activeAgent)
  const currentStreamingContent = useDebateStore((state) => state.currentStreamingContent)
  const status = useDebateStore((state) => state.status)
  const { isUserTurn, handRaised, toggleHandRaised, handleUserSubmit } = useDebate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [userInput, setUserInput] = useState('')

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, currentStreamingContent])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userInput.trim() && isUserTurn) {
      handleUserSubmit(userInput)
      setUserInput('')
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/50 bg-slate-800/50 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-100 font-semibold text-base">Debate Log</h2>
          <div className="flex items-center gap-3">
            {/* Hand raise button */}
            {status === 'running' && !isUserTurn && (
              <button
                onClick={toggleHandRaised}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  handRaised
                    ? 'bg-pink-500 text-white animate-pulse'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title={handRaised ? 'Cancel hand raise' : 'Raise hand to speak'}
              >
                <span className="text-base">✋</span>
                {handRaised ? 'Hand raised!' : 'Raise hand'}
              </button>
            )}
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
                {status === 'running' && isUserTurn && 'Your turn!'}
                {status === 'running' && !isUserTurn && 'In progress...'}
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
        {status === 'running' && activeAgent && !currentStreamingContent && !isUserTurn && (
          <TypingIndicator agent={activeAgent} />
        )}
        
        {/* Empty state */}
        {status === 'idle' && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
            <p>Enter a topic and start the debate</p>
          </div>
        )}
      </div>

      {/* User input area - shows when it's user's turn */}
      {isUserTurn && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700/50 bg-slate-800/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-pink-400 text-sm font-medium">Your turn to speak!</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your argument..."
              className="flex-1 px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 
                         placeholder-slate-500 focus:outline-none focus:border-pink-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={!userInput.trim()}
              className="px-4 py-2 rounded-lg bg-pink-500 text-white font-medium 
                         hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
