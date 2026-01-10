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
  try {
    const { model, messages, systemPrompt } = req.body as ChatRequest

    console.log('📨 Request received:', { model, messageCount: messages.length })

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    console.log('🚀 Starting stream...')

    const result = streamText({
      model: openai(model),
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      onChunk({ chunk }) {
        console.log('📦 onChunk:', chunk.type)
      },
      onError({ error }) {
        console.error('🔥 onError:', error)
      },
      onFinish({ text, finishReason }) {
        console.log('✅ onFinish:', { finishReason, textLength: text?.length })
      }
    })

    let chunkCount = 0
    for await (const chunk of result.textStream) {
      chunkCount++
      console.log('📝 Text chunk:', chunk.substring(0, 30))
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
    }

    // Get usage stats
    const usage = await result.usage
    console.log(`✅ Stream finished: ${chunkCount} chunks sent, tokens:`, usage)

    // Send usage info before [DONE]
    res.write(`data: ${JSON.stringify({ usage: { promptTokens: usage.promptTokens, completionTokens: usage.completionTokens, totalTokens: usage.totalTokens } })}\n\n`)
    res.write('data: [DONE]\n\n')
    res.end()

  } catch (error) {
    console.error('❌ Chat error:', error)
    res.status(500).json({ error: 'Internal server error' })
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
