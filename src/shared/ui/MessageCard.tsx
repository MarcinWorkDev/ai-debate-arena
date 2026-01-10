import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export interface MessageCardProps {
  avatarName: string
  avatarColor: string
  content: string
  timestamp: Date | string | number
  tokens?: {
    inputTokens?: number
    outputTokens?: number
    reasoningTokens?: number
    totalTokens?: number
  }
}

export function MessageCard({ avatarName, avatarColor, content, timestamp, tokens }: MessageCardProps) {
  const timeString = typeof timestamp === 'string' || typeof timestamp === 'number'
    ? new Date(timestamp).toLocaleTimeString()
    : timestamp.toLocaleTimeString()

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: avatarColor }}
        />
        <span className="text-white font-medium">{avatarName}</span>
        <span className="text-slate-500 text-xs">
          {timeString}
        </span>
        {tokens && (tokens.totalTokens || tokens.inputTokens || tokens.outputTokens || tokens.reasoningTokens) && (
          <div className="flex items-center gap-2 ml-auto text-xs">
            {tokens.inputTokens && tokens.inputTokens > 0 && (
              <span className="text-blue-400" title="Input tokens">
                In: {tokens.inputTokens}
              </span>
            )}
            {tokens.outputTokens && tokens.outputTokens > 0 && (
              <span className="text-green-400" title="Output tokens">
                Out: {tokens.outputTokens}
              </span>
            )}
            {tokens.reasoningTokens && tokens.reasoningTokens > 0 && (
              <span className="text-purple-400" title="Reasoning tokens">
                Reason: {tokens.reasoningTokens}
              </span>
            )}
            {tokens.totalTokens && tokens.totalTokens > 0 && (
              <span className="text-slate-500" title="Total tokens">
                Total: {tokens.totalTokens}
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
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}

