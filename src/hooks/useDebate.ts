import { useCallback, useRef } from 'react'
import { useDebateStore } from '../stores/debateStore'
import { agents, selectNextSpeaker, moderator } from '../lib/agents'
import { streamChat } from '../lib/api'

export function useDebate() {
  const {
    topic,
    messages,
    activeAgent,
    status,
    currentStreamingContent,
    roundCount,
    maxRounds,
    setTopic,
    setActiveAgent,
    setStatus,
    setMaxRounds,
    appendStreamingContent,
    finalizeMessage,
    incrementRound,
    reset,
  } = useDebateStore()

  const abortControllerRef = useRef<AbortController | null>(null)

  // Moderator summarizes the debate at the end
  const runModeratorSummary = useCallback(async () => {
    const store = useDebateStore.getState()
    
    // Make sure we're still in a valid state to summarize
    if (store.status !== 'running') {
      setStatus('finished')
      return
    }
    
    setActiveAgent(moderator)

    const debateHistory = store.messages
      .map(m => `**${m.agentName}** said: "${m.content}"`)
      .join('\n\n')

    const apiMessages = [
      { 
        role: 'user' as const, 
        content: `DEBATE TOPIC: "${store.topic}"\n\n---\nFULL DEBATE TRANSCRIPT:\n\n${debateHistory}\n\n---\nPlease provide a summary of this debate.`
      }
    ]

    try {
      for await (const chunk of streamChat({
        model: moderator.model,
        messages: apiMessages,
        systemPrompt: `You are the debate Moderator. ${moderator.persona}

Your task:
1. Summarize the key arguments from each participant
2. Identify main points of agreement and disagreement
3. Provide a balanced conclusion
4. Keep it concise but comprehensive (3-5 short sentences)
5. Speak in English`
      })) {
        // Don't break on status change during moderator summary - let it finish
        useDebateStore.getState().appendStreamingContent(chunk)
      }

      useDebateStore.getState().finalizeMessage()
    } catch (error) {
      console.error('Error during moderator summary:', error)
    } finally {
      setStatus('finished')
      setActiveAgent(null)
    }
  }, [appendStreamingContent, finalizeMessage, setActiveAgent, setStatus])

  const runAgentTurn = useCallback(async () => {
    const store = useDebateStore.getState()
    
    if (store.status !== 'running') return
    if (store.roundCount >= store.maxRounds) {
      // All rounds done - call moderator for summary
      await runModeratorSummary()
      return
    }

    const lastSpeakerId = store.messages.length > 0 
      ? store.messages[store.messages.length - 1].agentId 
      : null
    
    const nextAgent = selectNextSpeaker(lastSpeakerId)
    setActiveAgent(nextAgent)

    // Build conversation history - format all previous statements for context
    const debateHistory = store.messages
      .map(m => `**${m.agentName}** said: "${m.content}"`)
      .join('\n\n')

    const apiMessages = [
      { 
        role: 'user' as const, 
        content: debateHistory 
          ? `DEBATE TOPIC: "${store.topic}"\n\n---\nCONVERSATION SO FAR:\n\n${debateHistory}\n\n---\nNow respond to the above. Reference specific points others made. Do you agree or disagree with something specific?`
          : `DEBATE TOPIC: "${store.topic}"\n\nYou are the first speaker. Open the debate with your perspective on this topic.`
      }
    ]

    try {
      for await (const chunk of streamChat({
        model: nextAgent.model,
        messages: apiMessages,
        systemPrompt: `You are "${nextAgent.name}" in a debate. Your personality: ${nextAgent.persona}

CRITICAL RULES:
1. NEVER start with your name or any prefix like "[Name]:" - just speak directly
2. You MUST respond to specific points made by other debaters - quote or reference them
3. Agree, disagree, or build on what others said - don't just state your general opinion
4. Keep it to 1-2 short sentences maximum
5. Be conversational and engaging, like a real debate
6. Speak in a tone consistent with your role/persona
7. Stay on topic and avoid going off on tangents
8. If you are the first speaker, open the debate with your perspective on the topic
9. Speak in English`
      })) {
        const currentStatus = useDebateStore.getState().status
        if (currentStatus !== 'running') break
        useDebateStore.getState().appendStreamingContent(chunk)
      }

      const currentStatus = useDebateStore.getState().status
      if (currentStatus === 'running') {
        useDebateStore.getState().finalizeMessage()
        useDebateStore.getState().incrementRound()
        
        // Schedule next turn
        setTimeout(async () => {
          const state = useDebateStore.getState()
          if (state.status === 'running' && state.roundCount < state.maxRounds) {
            runAgentTurn()
          } else if (state.status === 'running' && state.roundCount >= state.maxRounds) {
            // Trigger moderator summary
            await runModeratorSummary()
          }
        }, 1500) // Pause between speakers
      }
    } catch (error) {
      console.error('Error during agent turn:', error)
      setStatus('paused')
    }
  }, [appendStreamingContent, finalizeMessage, incrementRound, setActiveAgent, setStatus, runModeratorSummary])

  const startDebate = useCallback(() => {
    const store = useDebateStore.getState()
    if (!store.topic.trim()) return
    
    setStatus('running')
    runAgentTurn()
  }, [runAgentTurn, setStatus])

  const pauseDebate = useCallback(() => {
    setStatus('paused')
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [setStatus])

  const resumeDebate = useCallback(() => {
    setStatus('running')
    runAgentTurn()
  }, [runAgentTurn, setStatus])

  const resetDebate = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    reset()
  }, [reset])

  return {
    // State
    topic,
    messages,
    activeAgent,
    status,
    currentStreamingContent,
    roundCount,
    maxRounds,
    agents,
    
    // Actions
    setTopic,
    setMaxRounds,
    startDebate,
    pauseDebate,
    resumeDebate,
    resetDebate,
  }
}
