import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PROSE_CLASSES, MARKDOWN_COMPONENTS } from './markdownStyles'

export interface MessageCardProps {
  avatarName: string
  avatarColor: string
  avatarModel?: string
  content: string
  timestamp: Date | string | number
  tokens?: {
    inputTokens?: number
    outputTokens?: number
    reasoningTokens?: number
    totalTokens?: number
  }
  prompt?: string
  systemPrompt?: string
  isAdmin?: boolean
}

export function MessageCard({ avatarName, avatarColor, avatarModel, content, timestamp, tokens, prompt, systemPrompt, isAdmin = false }: MessageCardProps) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  
  const timeString = typeof timestamp === 'string' || typeof timestamp === 'number'
    ? new Date(timestamp).toLocaleTimeString()
    : timestamp.toLocaleTimeString()
  
  const hasDebugInfo = isAdmin && (prompt || systemPrompt)

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: avatarColor }}
        />
        <span className="text-white font-medium">{avatarName}</span>
        {avatarModel && (
          <span className="text-[10px] text-white/40 font-medium px-1.5 py-0.5 rounded bg-white/5">
            {avatarModel}
          </span>
        )}
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
      <div className={`text-slate-300 text-base leading-relaxed ${PROSE_CLASSES}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
          {content}
        </ReactMarkdown>
      </div>
      
      {/* Admin Debug Section */}
      {hasDebugInfo && (
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
          {systemPrompt && (
            <div>
              <button
                onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                className="flex items-center gap-2 w-full text-left text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showSystemPrompt ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-medium">System Prompt</span>
              </button>
              {showSystemPrompt && (
                <div className="mt-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words font-mono">
                    {systemPrompt}
                  </pre>
                </div>
              )}
            </div>
          )}
          {prompt && (
            <div>
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="flex items-center gap-2 w-full text-left text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showPrompt ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-medium">Prompt</span>
              </button>
              {showPrompt && (
                <div className="mt-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words font-mono">
                    {prompt}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

