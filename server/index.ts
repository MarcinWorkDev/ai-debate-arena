import express from 'express'
import cors from 'cors'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import 'dotenv/config'

const app = express()
const PORT = 3001

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}))

app.use(express.json())

// OpenAI client
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

interface ChatRequest {
  model: string
  messages: { role: 'system' | 'user' | 'assistant', content: string }[]
  systemPrompt: string
}

app.post('/api/chat', async (req, res) => {
  let headersSent = false
  let responseClosed = false
  const REQUEST_TIMEOUT = 120000 // 2 minutes timeout for entire request
  const STREAM_TIMEOUT = 60000 // 1 minute timeout for stream inactivity
  
  // Set request timeout
  const requestTimeout = setTimeout(() => {
    console.error('⏱️ Request timeout after', REQUEST_TIMEOUT, 'ms')
    if (!responseClosed && isResponseWritable()) {
      safeWrite(`data: ${JSON.stringify({ error: 'Request timeout - OpenAI took too long to respond' })}\n\n`)
      safeWrite('data: [DONE]\n\n')
      res.end()
    }
    responseClosed = true
  }, REQUEST_TIMEOUT)
  
  // Helper function to check if response is still writable
  // After headers are sent (SSE), we only check if connection is still open
  const isResponseWritable = () => {
    if (headersSent) {
      // After SSE headers are sent, only check if connection is still open
      return !res.closed && !res.destroyed && !responseClosed
    }
    // Before headers are sent, check if headers haven't been sent yet
    return !res.headersSent && !res.closed && !res.destroyed
  }

  // Helper function to safely write to response
  const safeWrite = (data: string) => {
    if (isResponseWritable()) {
      try {
        res.write(data)
        return true
      } catch (err) {
        console.error('⚠️ Error writing to response:', err)
        responseClosed = true
        return false
      }
    }
    return false
  }

  try {
    const { model, messages, systemPrompt } = req.body as ChatRequest

    console.log('📨 Request received:', { 
      model, 
      messageCount: messages.length,
      timestamp: new Date().toISOString()
    })

    if (!process.env.OPENAI_API_KEY) {
      clearTimeout(requestTimeout)
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    headersSent = true

    // Handle client disconnect
    req.on('close', () => {
      console.log('🔌 Client disconnected - request closed')
      clearTimeout(requestTimeout)
      responseClosed = true
      // Don't destroy response immediately - let it finish gracefully if possible
    })
    
    // Handle request abort
    req.on('aborted', () => {
      console.log('🔌 Request aborted by client')
      clearTimeout(requestTimeout)
      responseClosed = true
    })

    console.log('🚀 Starting OpenAI stream...', { model, timestamp: new Date().toISOString() })

    let result
    let streamStartTime = Date.now()
    let lastChunkTime = Date.now()
    let streamTimeout: NodeJS.Timeout | null = null
    
    // Reset stream timeout on each chunk
    const resetStreamTimeout = () => {
      if (streamTimeout) clearTimeout(streamTimeout)
      streamTimeout = setTimeout(() => {
        console.error('⏱️ Stream inactivity timeout after', STREAM_TIMEOUT, 'ms')
        if (!responseClosed && isResponseWritable()) {
          safeWrite(`data: ${JSON.stringify({ error: 'Stream timeout - no data received from OpenAI' })}\n\n`)
          safeWrite('data: [DONE]\n\n')
          res.end()
        }
        responseClosed = true
      }, STREAM_TIMEOUT)
    }
    
    resetStreamTimeout() // Start timeout timer
    
    try {
      result = streamText({
        model: openai(model),
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        maxRetries: 2, // Retry up to 2 times on failure
        onChunk({ chunk }) {
          lastChunkTime = Date.now()
          resetStreamTimeout() // Reset timeout on each chunk
          console.log('📦 onChunk:', chunk.type, 'time since start:', Date.now() - streamStartTime, 'ms')
        },
        onError({ error }) {
          console.error('🔥 OpenAI onError:', {
            error: error instanceof Error ? error.message : String(error),
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          })
          
          // Check for specific OpenAI errors
          if (error instanceof Error) {
            if (error.message.includes('rate_limit') || error.message.includes('429')) {
              console.error('🚫 Rate limit error from OpenAI')
            }
            if (error.message.includes('timeout')) {
              console.error('⏱️ Timeout error from OpenAI')
            }
            if (error.message.includes('quota') || error.message.includes('billing')) {
              console.error('💳 Quota/billing error from OpenAI')
            }
          }
          
          // Try to send error to client if connection is still open
          if (isResponseWritable()) {
            const errorMessage = error instanceof Error ? error.message : 'Stream error'
            safeWrite(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          }
        },
        onFinish({ text, finishReason }) {
          console.log('✅ onFinish:', { 
            finishReason, 
            textLength: text?.length,
            duration: Date.now() - streamStartTime,
            timestamp: new Date().toISOString()
          })
          if (streamTimeout) clearTimeout(streamTimeout)
        }
      })
    } catch (streamInitError) {
      clearTimeout(requestTimeout)
      if (streamTimeout) clearTimeout(streamTimeout)
      console.error('❌ Error initializing stream:', {
        error: streamInitError instanceof Error ? streamInitError.message : String(streamInitError),
        stack: streamInitError instanceof Error ? streamInitError.stack : undefined,
        timestamp: new Date().toISOString()
      })
      const errorMessage = streamInitError instanceof Error ? streamInitError.message : 'Failed to initialize stream'
      if (isResponseWritable()) {
        safeWrite(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
        safeWrite('data: [DONE]\n\n')
        if (isResponseWritable()) {
          res.end()
        }
      } else {
        // If response is not writable, try to send error via normal response
        try {
          res.status(500).json({ error: errorMessage })
        } catch (err) {
          console.error('⚠️ Could not send error response:', err)
        }
      }
      return
    }

    // Ensure we have a valid result
    if (!result) {
      console.error('❌ Stream result is null/undefined')
      if (isResponseWritable()) {
        safeWrite(`data: ${JSON.stringify({ error: 'Failed to create stream' })}\n\n`)
        safeWrite('data: [DONE]\n\n')
        if (isResponseWritable()) {
          res.end()
        }
      }
      return
    }

    let chunkCount = 0
    try {
      if (!result.textStream) {
        clearTimeout(requestTimeout)
        if (streamTimeout) clearTimeout(streamTimeout)
        console.error('❌ textStream is not available')
        if (isResponseWritable()) {
          safeWrite(`data: ${JSON.stringify({ error: 'Stream not available' })}\n\n`)
          safeWrite('data: [DONE]\n\n')
          if (isResponseWritable()) {
            res.end()
          }
        }
        return
      }
      
      console.log('📡 Starting to read text stream...', { timestamp: new Date().toISOString() })
      for await (const chunk of result.textStream) {
        // Check if client is still connected
        if (!isResponseWritable()) {
          console.log('⚠️ Client disconnected, stopping stream')
          break
        }
        
        chunkCount++
        lastChunkTime = Date.now()
        resetStreamTimeout() // Reset timeout on each chunk
        console.log('📝 Text chunk #' + chunkCount + ':', chunk.substring(0, 50) + '...', 'time:', Date.now() - streamStartTime, 'ms')
        if (!safeWrite(`data: ${JSON.stringify({ content: chunk })}\n\n`)) {
          break
        }
      }
      console.log('✅ Finished reading stream, chunks:', chunkCount, 'duration:', Date.now() - streamStartTime, 'ms')
    } catch (streamError: unknown) {
      clearTimeout(requestTimeout)
      if (streamTimeout) clearTimeout(streamTimeout)
      // Handle stream errors (e.g., connection terminated)
      const error = streamError as { message?: string; code?: string }
      console.error('❌ Stream reading error:', {
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
        duration: Date.now() - streamStartTime
      })
      
      if (error.message?.includes('terminated') || error.code === 'UND_ERR_SOCKET') {
        console.log('⚠️ Stream terminated by client or network error')
        if (!isResponseWritable()) {
          return // Response already closed, nothing to do
        }
        // Send [DONE] even if stream was terminated
        safeWrite('data: [DONE]\n\n')
        if (isResponseWritable()) {
          res.end()
        }
        return
      } else {
        // For other errors, try to send error message
        if (isResponseWritable()) {
          const errorMessage = error.message || 'Stream error occurred'
          safeWrite(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          safeWrite('data: [DONE]\n\n')
          if (isResponseWritable()) {
            res.end()
          }
        }
        return
      }
    }

    // Only send usage if response is still writable
    if (!isResponseWritable()) {
      clearTimeout(requestTimeout)
      if (streamTimeout) clearTimeout(streamTimeout)
      console.log('⚠️ Response closed, skipping usage stats')
      return
    }

    // Get usage stats with timeout
    try {
      console.log('📊 Waiting for usage stats...', { timestamp: new Date().toISOString() })
      const usagePromise = result.usage
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Usage stats timeout')), 10000)
      )
      
      const usage = await Promise.race([usagePromise, timeoutPromise])
      console.log(`✅ Stream finished: ${chunkCount} chunks sent, tokens:`, usage, 'total duration:', Date.now() - streamStartTime, 'ms')

      // Send usage info before [DONE]
      const usageData = {
        promptTokens: (usage as any)?.promptTokens ?? 0,
        completionTokens: (usage as any)?.completionTokens ?? 0,
        totalTokens: (usage as any)?.totalTokens ?? usage?.totalTokens ?? 0,
        reasoningTokens: (usage as any)?.reasoningTokens ?? (usage as any)?.reasoningTokensUsed ?? 0
      }
      
      if (safeWrite(`data: ${JSON.stringify({ usage: usageData })}\n\n`)) {
        safeWrite('data: [DONE]\n\n')
      }
      
      clearTimeout(requestTimeout)
      if (streamTimeout) clearTimeout(streamTimeout)
      
      if (isResponseWritable()) {
        res.end()
      }
    } catch (usageError) {
      clearTimeout(requestTimeout)
      if (streamTimeout) clearTimeout(streamTimeout)
      console.error('⚠️ Error getting usage stats:', {
        error: usageError instanceof Error ? usageError.message : String(usageError),
        timestamp: new Date().toISOString()
      })
      if (isResponseWritable()) {
        safeWrite('data: [DONE]\n\n')
        res.end()
      }
    }

  } catch (error: unknown) {
    clearTimeout(requestTimeout)
    console.error('❌ Chat error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    
    // Only send error response if headers haven't been sent yet
    if (!headersSent && isResponseWritable()) {
      try {
        res.status(500).json({ error: 'Internal server error' })
      } catch (err) {
        console.error('⚠️ Error sending error response:', err)
      }
    } else if (headersSent && isResponseWritable()) {
      // If headers were sent (SSE started), send error via SSE
      safeWrite(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`)
      safeWrite('data: [DONE]\n\n')
      if (isResponseWritable()) {
        res.end()
      }
    }
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📡 OpenAI API: ${process.env.OPENAI_API_KEY ? 'configured' : 'NOT configured'}`)
})
