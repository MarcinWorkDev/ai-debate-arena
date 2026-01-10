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
  reasoningTokens?: number // Reasoning tokens (if applicable)
}

export interface StreamResult {
  content: string
  usage: TokenUsage | null
}

// Use relative URL in production (same origin), absolute URL in development
const API_URL = import.meta.env.PROD 
  ? '' // Empty string means same origin (backend serves frontend)
  : 'http://localhost:3001'
const REQUEST_TIMEOUT = 130000 // 2 minutes 10 seconds (slightly longer than server timeout)
const STREAM_INACTIVITY_TIMEOUT = 70000 // 70 seconds (slightly longer than server stream timeout)

// Helper function to get Firebase auth token
async function getAuthToken(): Promise<string | null> {
  try {
    const { auth } = await import('./firebase')
    const currentUser = auth.currentUser
    if (!currentUser) {
      return null
    }
    const token = await currentUser.getIdToken()
    return token
  } catch (error) {
    console.error('❌ Error getting auth token:', error)
    return null
  }
}

// Streaming chat with usage tracking
export async function streamChatWithUsage(
  request: ChatRequest,
  onChunk: (chunk: string) => void
): Promise<StreamResult> {
  const startTime = Date.now()
  
  // Get auth token
  const token = await getAuthToken()
  if (!token) {
    throw new Error('Authentication required - please sign in')
  }
  
  // Create AbortController for timeout
  const abortController = new AbortController()
  const timeoutId = setTimeout(() => {
    console.error('⏱️ Request timeout on frontend after', REQUEST_TIMEOUT, 'ms')
    abortController.abort()
  }, REQUEST_TIMEOUT)
  
  let response: Response
  try {
    response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
      signal: abortController.signal,
    })
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - server took too long to respond')
    }
    console.error('Network error:', error)
    throw new Error(`Failed to connect to server: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  if (!response.ok) {
    clearTimeout(timeoutId)
    const errorText = await response.text().catch(() => 'Unknown error')
    if (response.status === 401) {
      throw new Error('Authentication failed - please sign in again')
    }
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    clearTimeout(timeoutId)
    throw new Error('No response body - server returned empty response')
  }

  const decoder = new TextDecoder()
  let fullContent = ''
  let usage: TokenUsage | null = null
  let hasReceivedData = false
  let streamInactivityTimeout: ReturnType<typeof setTimeout> | null = null

  // Reset stream inactivity timeout
  const resetStreamTimeout = () => {
    if (streamInactivityTimeout) clearTimeout(streamInactivityTimeout)
    streamInactivityTimeout = setTimeout(() => {
      console.error('⏱️ Stream inactivity timeout on frontend after', STREAM_INACTIVITY_TIMEOUT, 'ms')
      reader.cancel()
      abortController.abort()
    }, STREAM_INACTIVITY_TIMEOUT)
  }
  
  resetStreamTimeout() // Start timeout

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        if (!hasReceivedData && fullContent === '') {
          clearTimeout(timeoutId)
          if (streamInactivityTimeout) clearTimeout(streamInactivityTimeout)
          throw new Error('Server closed connection without sending any data')
        }
        break
      }

      hasReceivedData = true
      resetStreamTimeout() // Reset timeout on each chunk
      
      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            clearTimeout(timeoutId)
            if (streamInactivityTimeout) clearTimeout(streamInactivityTimeout)
            return { content: fullContent, usage }
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) {
              clearTimeout(timeoutId)
              if (streamInactivityTimeout) clearTimeout(streamInactivityTimeout)
              throw new Error(`Server error: ${parsed.error}`)
            }
            if (parsed.content) {
              fullContent += parsed.content
              onChunk(parsed.content)
            }
            if (parsed.usage) {
              usage = parsed.usage
            }
          } catch (parseError) {
            // If it's a JSON parse error, ignore (partial chunk)
            // But if it's an error from the server, re-throw
            if (parseError instanceof Error && parseError.message.startsWith('Server error:')) {
              clearTimeout(timeoutId)
              if (streamInactivityTimeout) clearTimeout(streamInactivityTimeout)
              throw parseError
            }
          }
        }
      }
    }
  } catch (error) {
    clearTimeout(timeoutId)
    if (streamInactivityTimeout) clearTimeout(streamInactivityTimeout)
    console.error('Error reading stream:', error, 'duration:', Date.now() - startTime, 'ms')
    // If we have partial content, return it
    if (fullContent.length > 0) {
      return { content: fullContent, usage }
    }
    throw error
  }

  clearTimeout(timeoutId)
  if (streamInactivityTimeout) clearTimeout(streamInactivityTimeout)
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
