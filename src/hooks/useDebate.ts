import { useCallback } from 'react'
import { useDebateStore } from '../stores/debateStore'
import { useAuthStore } from '../stores/authStore'
import { useAvatarStore } from '../stores/avatarStore'
import { agents, selectNextSpeaker, moderator, createUserAgent, allAvailableAgents, avatarsToAgents } from '../lib/agents'
import { streamChatWithUsage } from '../lib/api'
import { updateUserCredits, createDebate, addMessage as addMessageToDb, updateDebate, addCreditsToDebate, getActiveDebate, getMessages } from '../lib/db'
import type { DebateMessage } from '../lib/db'

// Convert OpenAI tokens to credits (1 credit = 1000 tokens)
const tokensToCredits = (tokens: number): number => Math.ceil(tokens / 1000)

// Language prompts
const languageInstructions = {
  en: 'Speak in English.',
  pl: 'Mów po polsku.',
}

export function useDebate() {
  const {
    topic,
    language,
    messages,
    activeAgent,
    status,
    currentStreamingContent,
    roundCount,
    maxRounds,
    userName,
    handRaised,
    isUserTurn,
    debateId,
    setDebateId,
    setTopic,
    setLanguage,
    setActiveAgent,
    setStatus,
    setMaxRounds,
    setRoundCount,
    appendStreamingContent,
    finalizeMessage,
    incrementRound,
    reset,
    setUserName,
    toggleHandRaised,
    setIsUserTurn,
    submitUserMessage,
  } = useDebateStore()

  // Save message to Firestore
  const saveMessageToDb = useCallback(async (
    agentId: string,
    agentName: string,
    agentColor: string,
    agentModel: string,
    content: string,
    tokensUsed: number,
    inputTokens?: number,
    outputTokens?: number,
    reasoningTokens?: number
  ) => {
    const store = useDebateStore.getState()
    if (!store.debateId) return

    // Ensure all token values are numbers, not undefined
    const finalInputTokens = typeof inputTokens === 'number' ? inputTokens : 0
    const finalOutputTokens = typeof outputTokens === 'number' ? outputTokens : 0
    const finalReasoningTokens = typeof reasoningTokens === 'number' ? reasoningTokens : 0
    const finalTokensUsed = typeof tokensUsed === 'number' ? tokensUsed : 0

    const messageData = {
      avatarId: agentId,
      avatarName: agentName,
      avatarColor: agentColor,
      avatarModel: agentModel,
      content,
      timestamp: Date.now(),
      tokensUsed: finalTokensUsed,
      inputTokens: finalInputTokens,
      outputTokens: finalOutputTokens,
      reasoningTokens: finalReasoningTokens,
      parentMessageId: null,
    }

    // Log what we're saving with detailed info
    console.log('💾 Saving message to Firestore:', {
      debateId: store.debateId,
      agentName,
      tokensUsed: messageData.tokensUsed,
      inputTokens: messageData.inputTokens,
      outputTokens: messageData.outputTokens,
      reasoningTokens: messageData.reasoningTokens,
      rawInputs: { tokensUsed, inputTokens, outputTokens, reasoningTokens },
      messageDataKeys: Object.keys(messageData),
      messageDataValues: Object.values(messageData),
    })

    try {
      await addMessageToDb(store.debateId, messageData)
    } catch (error) {
      console.error('Error saving message to Firestore:', error)
    }
  }, [])

  // Moderator summarizes the debate at the end
  const runModeratorSummary = useCallback(async () => {
    const store = useDebateStore.getState()

    // Make sure we're still in a valid state to summarize
    if (store.status !== 'running') {
      setStatus('finished')
      return
    }

    // Check if moderator already provided summary (last message is from moderator)
    const lastMessage = store.messages[store.messages.length - 1]
    if (lastMessage && lastMessage.agentId === 'moderator') {
      setStatus('finished')
      setActiveAgent(null)
      return
    }

    setActiveAgent(moderator)

    const debateHistory = store.messages
      .map(m => `**${m.agentName}** said: "${m.content}"`)
      .join('\n\n')

    const langInstruction = languageInstructions[store.language]

    const apiMessages = [
      {
        role: 'user' as const,
        content: `DEBATE TOPIC: "${store.topic}"\n\n---\nFULL DEBATE TRANSCRIPT:\n\n${debateHistory}\n\n---\nPlease provide a summary of this debate.`
      }
    ]

    try {
      // Initialize streaming message
      useDebateStore.getState().addMessage({
        agentId: moderator.id,
        agentName: moderator.name,
        agentColor: moderator.color,
        agentModel: moderator.model,
        content: '',
        isStreaming: true,
      })

      const result = await streamChatWithUsage(
        {
          model: moderator.model,
          messages: apiMessages,
          systemPrompt: `You are the debate Moderator. ${moderator.persona}

Your task:
1. Summarize the key arguments from each participant
2. Identify main points of agreement and disagreement
3. Provide a balanced conclusion

CRITICAL: Format your summary using structured Markdown - DO NOT write plain text with just bold/italics. Use proper structure:

## Required Structure:

### Use Section Headings (## or ###)
Organize your summary with clear sections like:
- ## Key Arguments
- ## Points of Agreement
- ## Points of Disagreement  
- ## Conclusion

### Use Lists Extensively
- Use bullet lists (-) for arguments, points, examples
- Use numbered lists (1.) for sequences or priorities
- Nest lists when needed (indent with 2 spaces)

### Use Tables When Appropriate
For comparing positions or summarizing multiple participants:
| Participant | Key Argument | Position |
|------------|-------------|----------|
| Name | Argument | For/Against |

### Use Formatting Elements
- **Bold** for key concepts and conclusions
- *Italics* for participant names or emphasis
- Inline code (backticks) for technical terms if needed

### Structure Example:
## Summary

### Key Arguments
- **Participant A**: [argument]
- **Participant B**: [argument]

### Agreement Points
1. Point 1
2. Point 2

### Disagreement Points
- Issue 1: [description]
- Issue 2: [description]

## Conclusion
[Your balanced conclusion]

Make it visually structured and easy to scan - NOT a wall of text!
${langInstruction}`
        },
        (chunk) => {
          useDebateStore.getState().appendStreamingContent(chunk)
        }
      )

      // Extract token usage with proper defaults
      // Map API field names to database field names:
      // - promptTokens (from API) -> inputTokens (in DB)
      // - completionTokens (from API) -> outputTokens (in DB)
      const inputTokens = result.usage?.promptTokens ?? 0
      const outputTokens = result.usage?.completionTokens ?? 0
      const reasoningTokens = result.usage?.reasoningTokens ?? 0
      const tokensUsed = result.usage?.totalTokens ?? (inputTokens + outputTokens + reasoningTokens)
      const finalContent = result.content || useDebateStore.getState().currentStreamingContent || ''
      
      // Log token usage for debugging
      if (tokensUsed > 0 || inputTokens > 0 || outputTokens > 0 || reasoningTokens > 0) {
        console.log('Moderator token usage:', {
          total: tokensUsed,
          input: inputTokens,
          output: outputTokens,
          reasoning: reasoningTokens,
          usage: result.usage
        })
      }
      
      // Finalize message with content
      useDebateStore.getState().finalizeMessage(tokensUsed)
      useDebateStore.getState().addTokensUsed(tokensUsed)

      // Save to Firestore
      await saveMessageToDb(
        moderator.id,
        moderator.name,
        moderator.color,
        moderator.model,
        finalContent,
        tokensUsed,
        inputTokens,
        outputTokens,
        reasoningTokens
      )

      // Update debate credits and status in Firestore
      const currentDebateId = useDebateStore.getState().debateId
      if (currentDebateId) {
        if (tokensUsed > 0) {
          const creditsUsed = tokensToCredits(tokensUsed)
          await addCreditsToDebate(currentDebateId, creditsUsed)
        }
        await updateDebate(currentDebateId, { status: 'finished' })
      }

      // Update user credits in Firestore
      const authStore = useAuthStore.getState()
      if (authStore.user && tokensUsed > 0) {
        const creditsUsed = tokensToCredits(tokensUsed)
        await updateUserCredits(authStore.user.uid, creditsUsed)
        // Update local profile
        if (authStore.profile) {
          authStore.setProfile({
            ...authStore.profile,
            creditsAvailable: Math.max(0, authStore.profile.creditsAvailable - creditsUsed),
            creditsUsed: authStore.profile.creditsUsed + creditsUsed,
          })
        }
      }

      // Success - mark as finished
      setStatus('finished')
      setActiveAgent(null)
    } catch (error) {
      console.error('Error during moderator summary:', error)
      
      // Try to save partial content if available
      const store = useDebateStore.getState()
      const partialContent = store.currentStreamingContent || ''
      
      if (partialContent.trim().length > 0) {
        try {
          // Finalize the partial message
          useDebateStore.getState().finalizeMessage(0)
          
          // Save partial content to Firestore
          await saveMessageToDb(
            moderator.id,
            moderator.name,
            moderator.color,
            moderator.model,
            partialContent + '\n\n[Summary was interrupted due to an error]',
            0,
            0,
            0,
            0
          )
          
          // Update debate status
          const currentDebateId = store.debateId
          if (currentDebateId) {
            await updateDebate(currentDebateId, { status: 'finished' })
          }
          
          setStatus('finished')
          setActiveAgent(null)
          return
        } catch (saveError) {
          console.error('Error saving partial summary:', saveError)
        }
      }
      
      // If we couldn't save partial content, pause the debate so user can retry
      setStatus('paused')
      setActiveAgent(null)
    }
  }, [setActiveAgent, setStatus, saveMessageToDb])

  const runAgentTurn = useCallback(async () => {
    const store = useDebateStore.getState()

    if (store.status !== 'running') return
    
    // Check if moderator already provided summary (in DB or in local state)
    const lastMessage = store.messages[store.messages.length - 1]
    if (lastMessage && lastMessage.agentId === 'moderator') {
      setStatus('finished')
      setActiveAgent(null)
      return
    }
    
    // Check if moderator is currently streaming (partial content)
    if (store.activeAgent?.id === 'moderator' && store.currentStreamingContent) {
      return
    }
    
    if (store.roundCount >= store.maxRounds) {
      // All rounds done - call moderator for summary
      await runModeratorSummary()
      return
    }

    const lastSpeakerId = store.messages.length > 0
      ? store.messages[store.messages.length - 1].agentId
      : null

    // Get selected avatars from database and convert to agents
    const avatarStore = useAvatarStore.getState()
    const allAvatars = avatarStore.getVisibleAvatars()
    const selectedAvatars = store.selectedAgentIds.length > 0
      ? allAvatars.filter(avatar => store.selectedAgentIds.includes(avatar.id) && !avatar.isModerator)
      : []
    
    // Convert avatars to agents
    const selectedAgents = avatarsToAgents(selectedAvatars)

    const nextSpeaker = selectNextSpeaker(lastSpeakerId, store.handRaised, selectedAgents)

    // If it's user's turn, wait for their input
    if (nextSpeaker === 'user') {
      const userAgent = createUserAgent(store.userName)
      setActiveAgent(userAgent)
      setIsUserTurn(true)
      return // Wait for user to submit their message
    }

    const nextAgent = nextSpeaker
    setActiveAgent(nextAgent)

    // Build conversation history - format all previous statements for context
    const debateHistory = store.messages
      .map(m => `**${m.agentName}** said: "${m.content}"`)
      .join('\n\n')

    const langInstruction = languageInstructions[store.language]

    const apiMessages = [
      {
        role: 'user' as const,
        content: debateHistory
          ? `DEBATE TOPIC: "${store.topic}"\n\n---\nCONVERSATION SO FAR:\n\n${debateHistory}\n\n---\nNow respond to the above. Reference specific points others made. Do you agree or disagree with something specific?`
          : `DEBATE TOPIC: "${store.topic}"\n\nYou are the first speaker. Open the debate with your perspective on this topic.`
      }
    ]

    try {
      let aborted = false
      const result = await streamChatWithUsage(
        {
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
9. ${langInstruction}`
        },
        (chunk) => {
          const currentStatus = useDebateStore.getState().status
          if (currentStatus !== 'running') {
            aborted = true
            return
          }
          useDebateStore.getState().appendStreamingContent(chunk)
        }
      )

      if (aborted) return

      const currentStatus = useDebateStore.getState().status
      if (currentStatus === 'running') {
        // Log raw result.usage first
        console.log('🔍 Raw result.usage:', result.usage)
        
        // Extract token usage with proper defaults
        // Map API field names to database field names:
        // - promptTokens (from API) -> inputTokens (in DB)
        // - completionTokens (from API) -> outputTokens (in DB)
        const inputTokens = result.usage?.promptTokens ?? 0
        const outputTokens = result.usage?.completionTokens ?? 0
        const reasoningTokens = result.usage?.reasoningTokens ?? 0
        const tokensUsed = result.usage?.totalTokens ?? (inputTokens + outputTokens + reasoningTokens)
        
        // Log token usage for debugging
        console.log('📊 Extracted token usage:', {
          total: tokensUsed,
          input: inputTokens,
          output: outputTokens,
          reasoning: reasoningTokens,
          rawUsage: result.usage,
          hasUsage: !!result.usage
        })
        
        useDebateStore.getState().finalizeMessage(tokensUsed)
        useDebateStore.getState().addTokensUsed(tokensUsed)
        useDebateStore.getState().incrementRound()

        // Save to Firestore
        const store = useDebateStore.getState()
        
        await saveMessageToDb(
          nextAgent.id,
          nextAgent.name,
          nextAgent.color,
          nextAgent.model,
          result.content,
          tokensUsed,
          inputTokens,
          outputTokens,
          reasoningTokens
        )

        // Update debate roundCount and credits in Firestore
        if (store.debateId) {
          await updateDebate(store.debateId, { roundCount: store.roundCount })
          if (tokensUsed > 0) {
            const creditsUsed = tokensToCredits(tokensUsed)
            await addCreditsToDebate(store.debateId, creditsUsed)
          }
        }

        // Update user credits in Firestore
        const authStore = useAuthStore.getState()
        if (authStore.user && tokensUsed > 0) {
          const creditsUsed = tokensToCredits(tokensUsed)
          await updateUserCredits(authStore.user.uid, creditsUsed)
          // Update local profile
          if (authStore.profile) {
            authStore.setProfile({
              ...authStore.profile,
              creditsAvailable: Math.max(0, authStore.profile.creditsAvailable - creditsUsed),
              creditsUsed: authStore.profile.creditsUsed + creditsUsed,
            })
          }
        }

        // Schedule next turn or go to summary
        const currentState = useDebateStore.getState()
        if (currentState.roundCount >= currentState.maxRounds) {
          // If we've reached max rounds and last message used tokens, go to summary immediately
          if (tokensUsed > 0) {
            await runModeratorSummary()
          } else {
            // Wait a bit then go to summary
            setTimeout(async () => {
              await runModeratorSummary()
            }, 1500)
          }
        } else {
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
      }
    } catch (error) {
      console.error('Error during agent turn:', error)
      setStatus('paused')
    }
  }, [setActiveAgent, setStatus, setIsUserTurn, runModeratorSummary, saveMessageToDb])

  // Handle user submitting their message
  const handleUserSubmit = useCallback(async (content: string) => {
    if (!content.trim()) return
    
    const store = useDebateStore.getState()
    const userAgent = createUserAgent(store.userName)
    
    submitUserMessage(content)
    incrementRound()
    setActiveAgent(null)
    
    // Update debate roundCount in Firestore
    const currentStore = useDebateStore.getState()
    if (currentStore.debateId) {
      try {
        await updateDebate(currentStore.debateId, { roundCount: currentStore.roundCount })
      } catch (error) {
        console.error('Error updating debate roundCount:', error)
      }
    }
    
    // Save user message to Firestore
    try {
      await saveMessageToDb(
        'user',
        userAgent.name,
        userAgent.color,
        userAgent.model,
        content,
        0, // User messages don't use tokens
        0, // inputTokens
        0, // outputTokens
        0  // reasoningTokens
      )
    } catch (error) {
      console.error('Error saving user message to Firestore:', error)
    }
    
    // Continue debate after user's turn
    setTimeout(() => {
      const state = useDebateStore.getState()
      if (state.status === 'running' && state.roundCount < state.maxRounds) {
        runAgentTurn()
      } else if (state.status === 'running' && state.roundCount >= state.maxRounds) {
        runModeratorSummary()
      }
    }, 1000)
  }, [submitUserMessage, incrementRound, setActiveAgent, runAgentTurn, runModeratorSummary, saveMessageToDb])

  const startDebate = useCallback(async (): Promise<boolean> => {
    const store = useDebateStore.getState()
    if (!store.topic.trim()) return false
    
    // Check minimum 2 debaters selected
    const selectedCount = store.selectedAgentIds.length > 0 
      ? store.selectedAgentIds.length 
      : agents.filter(a => a.active).length
    
    if (selectedCount < 2) {
      console.error('Cannot start debate: minimum 2 debaters required')
      return false
    }
    
    // Get user ID from auth store
    const authStore = useAuthStore.getState()
    if (!authStore.user) {
      console.error('Cannot start debate: user not authenticated')
      return false
    }

    // Check if user has credits
    const hasCredits = (authStore.profile?.creditsAvailable ?? 0) > 0
    if (!hasCredits) {
      // Return false to indicate credits check failed
      // The component will handle showing the modal
      return false
    }

    try {
      // Get selected avatars from database and convert to agents
      const avatarStore = useAvatarStore.getState()
      const allAvatars = avatarStore.getVisibleAvatars()
      const selectedAvatars = store.selectedAgentIds.length > 0
        ? allAvatars.filter(avatar => store.selectedAgentIds.includes(avatar.id) && !avatar.isModerator)
        : []
      
      // Convert avatars to agents
      const selectedAgents = avatarsToAgents(selectedAvatars)
      
      // Add moderator (always included)
      const allAgents = [...selectedAgents, moderator]
      
      // Create debate in Firestore
      const debate = await createDebate(
        authStore.user.uid,
        store.topic,
        allAgents,
        store.language,
        store.maxRounds
      )
      
      // Set debate ID in store
      setDebateId(debate.id)
      
      // Now start the debate
      setStatus('running')
      runAgentTurn()
      return true
    } catch (error) {
      console.error('Error creating debate:', error)
      // Don't start debate if creation failed
      return false
    }
  }, [runAgentTurn, setStatus, setDebateId])

  const pauseDebate = useCallback(async () => {
    const store = useDebateStore.getState()
    setStatus('paused')
    
    // Update status in Firestore
    if (store.debateId) {
      try {
        await updateDebate(store.debateId, { status: 'paused' })
      } catch (error) {
        console.error('Error updating debate status:', error)
      }
    }
  }, [setStatus])

  const resumeDebate = useCallback(() => {
    const store = useDebateStore.getState()
    
    // Don't resume if debate is already finished
    if (store.status === 'finished') {
      return
    }
    
    // Check if moderator already provided summary
    const lastMessage = store.messages[store.messages.length - 1]
    if (lastMessage && lastMessage.agentId === 'moderator') {
      setStatus('finished')
      return
    }
    
    // Remove any incomplete streaming messages
    const messages = store.messages
    const lastMsg = messages[messages.length - 1]
    if (lastMsg && lastMsg.isStreaming && lastMsg.content === '') {
      // Remove the incomplete message
      const newMessages = messages.slice(0, -1)
      useDebateStore.setState({ messages: newMessages })
    }
    
    setStatus('running')
    runAgentTurn()
  }, [runAgentTurn, setStatus])

  const resetDebate = useCallback(async () => {
    const store = useDebateStore.getState()
    
    // Update debate status to finished in Firestore before resetting
    if (store.debateId) {
      try {
        await updateDebate(store.debateId, { status: 'finished' })
      } catch (error) {
        console.error('Error updating debate status:', error)
      }
    }
    
    reset()
  }, [reset])

  // Load and restore debate from Firestore
  const loadAndRestoreDebate = useCallback(async () => {
    const authStore = useAuthStore.getState()
    if (!authStore.user) return

    const store = useDebateStore.getState()
    // Don't load if we already have a debate loaded
    if (store.debateId && store.messages.length > 0) return

    try {
      const debate = await getActiveDebate(authStore.user.uid)
      if (!debate) return

      // Load messages
      const messages = await getMessages(debate.id)

      // Convert DebateMessage[] to Message[]
      const convertedMessages = messages.map((msg: DebateMessage) => ({
        id: msg.id,
        agentId: msg.avatarId,
        agentName: msg.avatarName,
        agentColor: msg.avatarColor,
        agentModel: msg.avatarModel,
        content: msg.content,
        timestamp: msg.timestamp,
        tokensUsed: msg.tokensUsed,
      }))

      // Restore state - clear first to avoid duplicates
      store.reset()
      store.setDebateId(debate.id)
      store.setTopic(debate.title)
      store.setLanguage(debate.language)
      store.setMaxRounds(debate.maxRounds)
      store.setStatus(debate.status)
      
      // Set messages
      convertedMessages.forEach(msg => {
        store.addMessage({
          agentId: msg.agentId,
          agentName: msg.agentName,
          agentColor: msg.agentColor,
          agentModel: msg.agentModel,
          content: msg.content,
          tokensUsed: msg.tokensUsed,
        })
      })

      // Set roundCount
      store.setRoundCount(debate.roundCount)

      // Restore selected agent IDs from avatarsSnapshot (exclude moderator and user)
      const selectedIds = debate.avatarsSnapshot
        .filter(snapshot => snapshot.avatarId && snapshot.avatarId !== 'moderator' && snapshot.avatarId !== 'user')
        .map(snapshot => snapshot.avatarId!)
      store.setSelectedAgentIds(selectedIds)

      // Don't auto-continue debates - user must manually resume
      // This prevents debates from continuing after pause/reset
    } catch (error) {
      console.error('Error loading debate:', error)
    }
  }, [runAgentTurn])

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
    userName,
    handRaised,
    isUserTurn,
    
    // Actions
    setTopic,
    setMaxRounds,
    startDebate,
    pauseDebate,
    resumeDebate,
    resetDebate,
    setUserName,
    toggleHandRaised,
    handleUserSubmit,
    loadAndRestoreDebate,
  }
}
