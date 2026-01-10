import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
        <div className="text-slate-200 text-base leading-relaxed prose prose-base prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-headings:text-slate-100 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-strong:text-white prose-em:text-slate-300 prose-code:text-pink-400 prose-code:bg-slate-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded prose-pre:p-3 prose-pre:my-2 prose-hr:border-slate-700 prose-table:my-4 prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-slate-600 prose-th:bg-slate-800 prose-th:p-3 prose-th:text-left prose-th:font-semibold prose-th:text-slate-200 prose-td:border prose-td:border-slate-700 prose-td:p-3 prose-td:text-slate-300 prose-tr:hover:bg-slate-800/30">
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
          {message.isStreaming && (
            <span className="inline-block w-0.5 h-4 ml-1 bg-slate-400 animate-pulse" />
          )}
        </div>
      </div>
    </motion.div>
  )
}
