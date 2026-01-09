import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import type { Message } from '../../stores/debateStore'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isModerator = message.agentId === 'moderator'
  
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
        <div className="text-slate-200 text-sm leading-relaxed prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
          <ReactMarkdown>
            {message.content}
          </ReactMarkdown>
          {message.isStreaming && (
            <span className="inline-block w-0.5 h-4 ml-1 bg-slate-400 animate-pulse" />
          )}
        </div>
      </div>
    </motion.div>
  )
}
