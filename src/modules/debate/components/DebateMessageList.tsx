import type { DebateMessage } from '../../../lib/db'
import { MessageCard } from '../../../shared/ui/MessageCard'
import { EmptyState } from '../../../shared/ui/EmptyState'

interface DebateMessageListProps {
  messages: DebateMessage[]
  showTokens?: boolean
  isAdmin?: boolean
}

export function DebateMessageList({ messages, showTokens = true, isAdmin = false }: DebateMessageListProps) {
  if (messages.length === 0) {
    return (
      <EmptyState
        message="No messages in this debate yet."
      />
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageCard
          key={message.id}
          avatarName={message.avatarName}
          avatarColor={message.avatarColor}
          avatarModel={message.avatarModel}
          content={message.content}
          timestamp={message.timestamp}
          tokens={showTokens ? {
            inputTokens: message.inputTokens,
            outputTokens: message.outputTokens,
            reasoningTokens: message.reasoningTokens,
            totalTokens: message.tokensUsed,
          } : undefined}
          prompt={message.prompt}
          systemPrompt={message.systemPrompt}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  )
}

