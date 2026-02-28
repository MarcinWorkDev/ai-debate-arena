import { useState, memo } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useDebateStore } from '../../stores/debateStore'
import type { Message } from '../../stores/debateStore'
import { PROSE_CLASSES, MARKDOWN_COMPONENTS } from '../../shared/ui/markdownStyles'

interface MessageBubbleProps {
  message: Message
}

export const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  const language = useDebateStore((state) => state.language)
  const isModerator = message.agentId === 'moderator'
  // Collapsible for 'summary' and 'escalation' roundTypes
  // 'final_summary' is NOT collapsible - it's visible as normal message
  const isCollapsible = message.roundType === 'summary' || message.roundType === 'escalation'
  const [isExpanded, setIsExpanded] = useState(false) // Collapsed by default for summaries and escalations
  const isPl = language === 'pl'
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className={`relative ${isModerator ? 'bg-slate-800/30 -mx-2 px-2 py-2 rounded-lg' : ''}`}
    >
      {/* Agent header */}
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: message.agentColor }}
        />
        <span
          className="text-sm font-semibold"
          style={{ color: message.agentColor }}
        >
          {isModerator && '👔 '}{message.agentName}
        </span>
        <span className="text-[10px] text-white/40 font-medium px-1.5 py-0.5 rounded bg-white/5">
          {message.agentModel}
        </span>
        <span className="text-white/30 text-xs ml-auto">
          {new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Message content with Markdown */}
      <div
        className="relative p-3.5 rounded-lg bg-slate-800/50 border border-slate-700/50"
        style={{
          borderLeftColor: message.agentColor,
          borderLeftWidth: '3px',
        }}
      >
        {isCollapsible ? (
          <>
            {/* Collapsible summary/escalation toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center gap-2 text-left hover:bg-slate-700/30 rounded px-1 py-0.5 -mx-1 transition-colors"
            >
              <span className="text-slate-500 text-xs">{isExpanded ? '▼' : '▶'}</span>
              <span className="text-sm text-slate-400">
                {message.roundType === 'escalation' 
                  ? (isPl ? '🔥 Eskalacja debaty' : '🔥 Debate Escalation')
                  : (isPl ? '📊 Podsumowanie debaty' : '📊 Debate Summary')
                }
              </span>
              {!isExpanded && (
                <span className="text-xs text-slate-500 ml-auto">
                  {isPl ? 'kliknij aby rozwinąć' : 'click to expand'}
                </span>
              )}
            </button>

            {/* Summary/Escalation content (collapsible) */}
            {isExpanded && (
              <div className={`mt-3 text-slate-200 text-base leading-relaxed ${PROSE_CLASSES}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </>
        ) : (
          <div className={`text-slate-200 text-base leading-relaxed ${PROSE_CLASSES}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
              {message.content}
            </ReactMarkdown>
            {message.isStreaming && (
              <span className="inline-block w-0.5 h-4 ml-1 bg-slate-400 animate-pulse" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isStreaming === nextProps.message.isStreaming
  )
})
