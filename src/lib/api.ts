export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  model: string
  messages: ChatMessage[]
  systemPrompt: string
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface StreamResult {
  content: string
  usage: TokenUsage | null
}

const API_URL = 'http://localhost:3001'

// Streaming chat with usage tracking
export async function streamChatWithUsage(
  request: ChatRequest,
  onChunk: (chunk: string) => void
): Promise<StreamResult> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let fullContent = ''
  let usage: TokenUsage | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') {
          return { content: fullContent, usage }
        }
        try {
          const parsed = JSON.parse(data)
          if (parsed.content) {
            fullContent += parsed.content
            onChunk(parsed.content)
          }
          if (parsed.usage) {
            usage = parsed.usage
          }
        } catch {
          // Ignore parse errors for partial chunks
        }
      }
    }
  }

  return { content: fullContent, usage }
}

// Legacy generator-based API for backwards compatibility
export async function* streamChat(request: ChatRequest): AsyncGenerator<string> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') {
          return
        }
        try {
          const parsed = JSON.parse(data)
          if (parsed.content) {
            yield parsed.content
          }
        } catch {
          // Ignore parse errors for partial chunks
        }
      }
    }
  }
}

// Mock streaming for UI development without backend
export async function* mockStreamChat(agentName: string, topic: string): AsyncGenerator<string> {
  const responses: Record<string, string[]> = {
    'OPTYMISTA': [
      `Widzę ogromny potencjał w temacie "${topic}"! `,
      'To może przynieść wiele korzyści, ',
      'jeśli tylko odpowiednio to wykorzystamy.',
    ],
    'SCEPTYK': [
      'Hmm, muszę zakwestionować to podejście. ',
      'Czy na pewno rozważyliśmy wszystkie ryzyka? ',
      'Brakuje mi tu krytycznej analizy.',
    ],
    'PRAGMATYK': [
      'Skupmy się na konkretach. ',
      'Jakie są realne kroki wdrożenia? ',
      'Potrzebujemy wykonalnego planu.',
    ],
    'WIZJONER': [
      'Patrząc z szerszej perspektywy, ',
      'to może zmienić całą branżę. ',
      'Za 10 lat będziemy to wspominać.',
    ],
  }

  const words = responses[agentName] || ['Interesujący punkt widzenia. ', 'Muszę to przemyśleć.']
  
  for (const word of words) {
    await new Promise(resolve => setTimeout(resolve, 100))
    yield word
  }
}
