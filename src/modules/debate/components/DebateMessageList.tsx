import type { DebateMessage } from '../../../lib/db'
import { MessageCard } from '../../../shared/ui/MessageCard'
import { EmptyState } from '../../../shared/ui/EmptyState'

interface DebateMessageListProps {
  messages: DebateMessage[]
  showTokens?: boolean
}

export function DebateMessageList({ messages, showTokens = true }: DebateMessageListProps) {
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
          content={message.content}
          timestamp={message.timestamp}
          tokens={showTokens ? {
            inputTokens: message.inputTokens,
            outputTokens: message.outputTokens,
            reasoningTokens: message.reasoningTokens,
            totalTokens: message.tokensUsed,
          } : undefined}
        />
      ))}
    </div>
  )
}

