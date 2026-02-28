import { useCallback } from 'react'
import { useDebateStore } from '../stores/debateStore'
import { useAuthStore } from '../stores/authStore'
import { useAvatarStore } from '../stores/avatarStore'
import { selectNextSpeaker, moderator, createUserAgent, avatarsToAgents, type Agent } from '../lib/agents'
import { streamChatWithUsage } from '../lib/api'
import { updateUserCredits, createDebate, addMessage as addMessageToDb, updateDebate, addCreditsToDebate, getActiveDebate, getMessages } from '../lib/db'
import type { DebateMessage } from '../lib/db'
import type { RoundType, ModeratorSummaryData, EscalationData } from '../lib/roundTypes'
import {
  getStatementSystemPrompt,
  getSummarySystemPrompt,
  getEscalationSystemPrompt,
  getFinalSummarySystemPrompt,
  formatModeratorSummary,
  LANGUAGE_INSTRUCTIONS
} from '../lib/prompts'
import {
  DEFAULT_ROUND_CONFIG,
  countStatements,
  shouldRunModeratorRound,
  shouldRunEscalation
} from '../lib/roundConfig'

// Convert OpenAI tokens to credits (1 credit = 1000 tokens)
const tokensToCredits = (tokens: number): number => Math.ceil(tokens / 1000)

export function useDebate() {
  const {
    topic,
    messages,
    activeAgent,
    status,
    currentStreamingContent,
    roundCount,
    maxRounds,
    userName,
    handRaised,
    isUserTurn,
    setDebateId,
    setTopic,
    setActiveAgent,
    setStatus,
    setMaxRounds,
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
    reasoningTokens?: number,
    prompt?: string,
    systemPrompt?: string,
    roundType?: RoundType
  ) => {
    const store = useDebateStore.getState()
    if (!store.debateId) return

    const finalInputTokens = typeof inputTokens === 'number' ? inputTokens : 0
    const finalOutputTokens = typeof outputTokens === 'number' ? outputTokens : 0
    const finalReasoningTokens = typeof reasoningTokens === 'number' ? reasoningTokens : 0
    const finalTokensUsed = typeof tokensUsed === 'number' ? tokensUsed : 0

    const messageData: any = {
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

    if (prompt !== undefined) {
      messageData.prompt = prompt
    }
    if (systemPrompt !== undefined) {
      messageData.systemPrompt = systemPrompt
    }
    if (roundType) {
      messageData.roundType = roundType
    }

    try {
      await addMessageToDb(store.debateId, messageData)
    } catch (error) {
      console.error('Error saving message to Firestore:', error)
    }
  }, [])

  // Helper to update credits after API call
  const updateCredits = useCallback(async (tokensUsed: number) => {
    if (tokensUsed <= 0) return

    const creditsUsed = tokensToCredits(tokensUsed)

    // Update debate credits
    const currentDebateId = useDebateStore.getState().debateId
    if (currentDebateId) {
      try {
        await addCreditsToDebate(currentDebateId, creditsUsed)
      } catch (error) {
        console.error('Error updating debate credits:', error)
      }
    }

    // Update user credits
    const authStore = useAuthStore.getState()
    if (authStore.user) {
      try {
        await updateUserCredits(authStore.user.uid, creditsUsed)
        if (authStore.profile) {
          authStore.setProfile({
            ...authStore.profile,
            creditsAvailable: Math.max(0, authStore.profile.creditsAvailable - creditsUsed),
            creditsUsed: authStore.profile.creditsUsed + creditsUsed,
          })
        }
      } catch (error) {
        console.error('Error updating user credits:', error)
      }
    }
  }, [])

  // ============================================
  // ROUND EXECUTORS
  // ============================================

  // Execute STATEMENT round - random avatar responds
  const executeStatementRound = useCallback(async (): Promise<boolean> => {
    const store = useDebateStore.getState()

    const lastSpeakerId = store.messages.length > 0
      ? store.messages[store.messages.length - 1].agentId
      : null

    // Get selected avatars and convert to agents
    const avatarStore = useAvatarStore.getState()
    const allAvatars = avatarStore.getVisibleAvatars()
    const selectedAvatars = store.selectedAgentIds.length > 0
      ? allAvatars.filter(avatar => store.selectedAgentIds.includes(avatar.id))
      : []
    const selectedAgents = avatarsToAgents(selectedAvatars)

    // Check if escalation data exists and try to find the target agent
    let nextSpeaker: Agent | 'user'
    let escalationDataToUse: EscalationData | null = null

    if (store.escalationData) {
      // Try to find agent by name (escalation_target)
      const targetAgent = selectedAgents.find(agent => agent.name === store.escalationData!.escalation_target)
      if (targetAgent) {
        nextSpeaker = targetAgent
        escalationDataToUse = store.escalationData
      } else {
        // Target not found, use standard selection
        nextSpeaker = selectNextSpeaker(lastSpeakerId, store.handRaised, selectedAgents)
      }
      // Clear escalation data after use (one-time use)
      useDebateStore.getState().setEscalationData(null)
    } else {
      // No escalation data, use standard selection
      nextSpeaker = selectNextSpeaker(lastSpeakerId, store.handRaised, selectedAgents)
    }

    // If it's user's turn, wait for input
    if (nextSpeaker === 'user') {
      const userAgent = createUserAgent(store.userName)
      setActiveAgent(userAgent)
      setIsUserTurn(true)
      return false // Don't continue loop - wait for user
    }

    const nextAgent = nextSpeaker
    setActiveAgent(nextAgent)

    // Build conversation history - filter out summaries (they're in systemPrompt)
    const participantMessages = store.messages.filter(m => m.roundType !== 'summary' && m.roundType !== 'escalation')
    const recentMessages = participantMessages.slice(-DEFAULT_ROUND_CONFIG.statementContextSize)
    const debateHistory = recentMessages
      .map(m => `**${m.agentName}** said: "${m.content}"`)
      .join('\n\n')

    const systemPrompt = getStatementSystemPrompt(
      nextAgent.name,
      nextAgent.persona,
      store.language,
      store.moderatorSummary,
      escalationDataToUse // Pass escalation data (one-time use, already cleared if used)
    )

    const apiMessages = [
      {
        role: 'user' as const,
        content: debateHistory
          ? `DEBATE TOPIC: "${store.topic}"\n\n---\nCONVERSATION SO FAR:\n\n${debateHistory}\n\n---\nNow it's your turn to speak.`
          : `DEBATE TOPIC: "${store.topic}"\n\nYou are the first speaker. Open the debate with your perspective on this topic.`
      }
    ]

    try {
      let aborted = false
      const result = await streamChatWithUsage(
        {
          model: nextAgent.model,
          messages: apiMessages,
          systemPrompt,
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

      if (aborted) return false

      const currentStatus = useDebateStore.getState().status
      if (currentStatus !== 'running') return false

      // Extract token usage
      const inputTokens = result.usage?.promptTokens ?? 0
      const outputTokens = result.usage?.completionTokens ?? 0
      const reasoningTokens = result.usage?.reasoningTokens ?? 0
      const tokensUsed = result.usage?.totalTokens ?? (inputTokens + outputTokens + reasoningTokens)

      // Add message manually with roundType (don't use finalizeMessage - it doesn't support roundType)
      const finalContent = result.content || useDebateStore.getState().currentStreamingContent || ''
      useDebateStore.getState().addMessage({
        agentId: nextAgent.id,
        agentName: nextAgent.name,
        agentColor: nextAgent.color,
        agentModel: nextAgent.model,
        content: finalContent,
        tokensUsed,
        roundType: 'statement',
      })
      // Clear streaming content
      useDebateStore.setState({ currentStreamingContent: '' })
      useDebateStore.getState().addTokensUsed(tokensUsed)
      useDebateStore.getState().incrementRound()

      // Save to Firestore
      const promptText = JSON.stringify(apiMessages, null, 2)
      await saveMessageToDb(
        nextAgent.id,
        nextAgent.name,
        nextAgent.color,
        nextAgent.model,
        result.content,
        tokensUsed,
        inputTokens,
        outputTokens,
        reasoningTokens,
        promptText,
        systemPrompt,
        'statement'
      )

      // Update debate roundCount
      const storeAfter = useDebateStore.getState()
      if (storeAfter.debateId) {
        await updateDebate(storeAfter.debateId, { roundCount: storeAfter.roundCount })
      }

      await updateCredits(tokensUsed)
      return true
    } catch (error) {
      console.error('Error during statement round:', error)
      setStatus('paused')
      return false
    }
  }, [setActiveAgent, setIsUserTurn, setStatus, saveMessageToDb, updateCredits])

  // Execute SUMMARY round - moderator creates JSON summary
  const executeSummaryRound = useCallback(async (): Promise<boolean> => {
    const store = useDebateStore.getState()

    setActiveAgent(moderator)

    // Get recent messages for summary context (exclude previous summaries, keep escalations)
    const allMessages = store.messages.filter(m => m.roundType !== 'summary' && m.roundType !== 'escalation')
    const recentMessages = allMessages.slice(-DEFAULT_ROUND_CONFIG.summaryContextSize)
    const debateHistory = recentMessages
      .map(m => `**${m.agentName}** said: "${m.content}"`)
      .join('\n\n')

    const systemPrompt = getSummarySystemPrompt(store.language)
    const apiMessages = [
      {
        role: 'user' as const,
        content: `DEBATE TOPIC: "${store.topic}"\n\n---\nRECENT DEBATE TRANSCRIPT (last ${recentMessages.length} messages):\n\n${debateHistory}\n\n---\nAnalyze the current state of the debate and provide a summary.`
      }
    ]

    try {
      const result = await streamChatWithUsage(
        {
          model: moderator.model,
          messages: apiMessages,
          systemPrompt,
        },
        () => {} // No streaming for summary
      )

      const content = result.content || ''

      // Parse JSON from response
      let jsonContent = content.trim()
      if (jsonContent.startsWith('```')) {
        const lines = jsonContent.split('\n')
        const lastLine = lines[lines.length - 1]
        if (lastLine === '```') {
          jsonContent = lines.slice(1, -1).join('\n')
        }
      }
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonContent = jsonMatch[0]
      }

      // Extract token usage
      const inputTokens = result.usage?.promptTokens ?? 0
      const outputTokens = result.usage?.completionTokens ?? 0
      const reasoningTokens = result.usage?.reasoningTokens ?? 0
      const tokensUsed = result.usage?.totalTokens ?? (inputTokens + outputTokens + reasoningTokens)

      try {
        const summary = JSON.parse(jsonContent) as ModeratorSummaryData
        summary.position_shifts = summary.position_shifts || []

        if (
          Array.isArray(summary.core_disagreements) &&
          Array.isArray(summary.points_of_tentative_agreement) &&
          Array.isArray(summary.arguments_repeated_too_often) &&
          Array.isArray(summary.missing_or_underexplored_angles)
        ) {
          // Save to store
          useDebateStore.getState().setModeratorSummary(summary)

          // Format as markdown for display
          const summaryContent = formatModeratorSummary(summary, store.language)

          // Add summary message (collapsible via roundType)
          useDebateStore.getState().addMessage({
            agentId: moderator.id,
            agentName: moderator.name,
            agentColor: moderator.color,
            agentModel: moderator.model,
            content: summaryContent,
            roundType: 'summary',
            tokensUsed,
          })

          // Save to Firestore
          const promptText = JSON.stringify(apiMessages, null, 2)
          await saveMessageToDb(
            moderator.id,
            moderator.name,
            moderator.color,
            moderator.model,
            summaryContent,
            tokensUsed,
            inputTokens,
            outputTokens,
            reasoningTokens,
            promptText,
            systemPrompt,
            'summary'
          )
        }
      } catch (parseError) {
        console.error('Error parsing moderator summary JSON:', parseError)
      }

      useDebateStore.getState().addTokensUsed(tokensUsed)
      await updateCredits(tokensUsed)
      setActiveAgent(null)
      return true
    } catch (error) {
      console.error('Error during summary round:', error)
      setActiveAgent(null)
      return false
    }
  }, [setActiveAgent, saveMessageToDb, updateCredits])

  // Execute ESCALATION round - moderator heats up discussion
  const executeEscalationRound = useCallback(async (): Promise<boolean> => {
    const store = useDebateStore.getState()

    setActiveAgent(moderator)

    // Get recent messages for context (exclude summaries)
    const recentMessages = store.messages
      .filter(m => m.roundType !== 'summary' && m.roundType !== 'escalation')
      .slice(-DEFAULT_ROUND_CONFIG.statementContextSize)
    const debateHistory = recentMessages
      .map(m => `**${m.agentName}** said: "${m.content}"`)
      .join('\n\n')

    const systemPrompt = getEscalationSystemPrompt(store.language)
    const apiMessages = [
      {
        role: 'user' as const,
        content: `DEBATE TOPIC: "${store.topic}"\n\n---\nRECENT DEBATE:\n\n${debateHistory}\n\n---\nAs a moderator, stimulate the discussion with provocative questions.`
      }
    ]

    try {
      const result = await streamChatWithUsage(
        {
          model: moderator.model,
          messages: apiMessages,
          systemPrompt,
        },
        () => {} // No streaming for escalation
      )

      const content = result.content || ''

      // Parse JSON from response
      let jsonContent = content.trim()
      if (jsonContent.startsWith('```')) {
        const lines = jsonContent.split('\n')
        const lastLine = lines[lines.length - 1]
        if (lastLine === '```') {
          jsonContent = lines.slice(1, -1).join('\n')
        }
      }
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonContent = jsonMatch[0]
      }

      // Extract token usage
      const inputTokens = result.usage?.promptTokens ?? 0
      const outputTokens = result.usage?.completionTokens ?? 0
      const reasoningTokens = result.usage?.reasoningTokens ?? 0
      const tokensUsed = result.usage?.totalTokens ?? (inputTokens + outputTokens + reasoningTokens)

      try {
        const escalation = JSON.parse(jsonContent) as EscalationData

        if (
          escalation.escalation_target &&
          escalation.assumption_to_challenge &&
          escalation.why_problematic &&
          escalation.instruction_to_participant
        ) {
          // Save to store
          useDebateStore.getState().setEscalationData(escalation)

          // Format as markdown for display
          const escalationContent = `**Escalation Target:** ${escalation.escalation_target}\n\n**Assumption to Challenge:** ${escalation.assumption_to_challenge}\n\n**Why Problematic:** ${escalation.why_problematic}\n\n**Instruction:** ${escalation.instruction_to_participant}`

          // Add escalation message (collapsible via roundType)
          useDebateStore.getState().addMessage({
            agentId: moderator.id,
            agentName: moderator.name,
            agentColor: moderator.color,
            agentModel: moderator.model,
            content: escalationContent,
            roundType: 'escalation',
            tokensUsed,
          })

          // Save to Firestore
          const promptText = JSON.stringify(apiMessages, null, 2)
          await saveMessageToDb(
            moderator.id,
            moderator.name,
            moderator.color,
            moderator.model,
            escalationContent,
            tokensUsed,
            inputTokens,
            outputTokens,
            reasoningTokens,
            promptText,
            systemPrompt,
            'escalation'
          )
        }
      } catch (parseError) {
        console.error('Error parsing escalation JSON:', parseError)
        // Still add message with raw content for debugging
        useDebateStore.getState().addMessage({
          agentId: moderator.id,
          agentName: moderator.name,
          agentColor: moderator.color,
          agentModel: moderator.model,
          content: content,
          tokensUsed,
          roundType: 'escalation',
        })
      }

      useDebateStore.getState().addTokensUsed(tokensUsed)
      await updateCredits(tokensUsed)
      setActiveAgent(null)
      return true
    } catch (error) {
      console.error('Error during escalation round:', error)
      setActiveAgent(null)
      return false
    }
  }, [setActiveAgent, saveMessageToDb, updateCredits])

  // Execute FINAL_SUMMARY round - moderator wraps up debate
  const executeFinalSummaryRound = useCallback(async (): Promise<boolean> => {
    const store = useDebateStore.getState()

    // Check if already finished
    const lastMessage = store.messages[store.messages.length - 1]
    if (lastMessage && lastMessage.agentId === 'moderator' && lastMessage.roundType === 'final_summary') {
      setStatus('finished')
      setActiveAgent(null)
      return false
    }

    setActiveAgent(moderator)

    // Build full debate history
    const debateHistory = store.messages
      .filter(m => m.roundType !== 'summary') // Include escalations but not summaries
      .map(m => `**${m.agentName}** said: "${m.content}"`)
      .join('\n\n')

    const langInstruction = LANGUAGE_INSTRUCTIONS[store.language]
    const systemPrompt = getFinalSummarySystemPrompt(moderator.persona, store.language)
    const apiMessages = [
      {
        role: 'user' as const,
        content: `DEBATE TOPIC: "${store.topic}"\n\nLANGUAGE: Respond in ${store.language === 'en' ? 'English' : 'Polish'} (${langInstruction})\n\n---\nFULL DEBATE TRANSCRIPT:\n\n${debateHistory}\n\n---\nPlease provide a summary of this debate.`
      }
    ]

    try {
      const result = await streamChatWithUsage(
        {
          model: moderator.model,
          messages: apiMessages,
          systemPrompt,
        },
        (chunk) => {
          useDebateStore.getState().appendStreamingContent(chunk)
        }
      )

      const inputTokens = result.usage?.promptTokens ?? 0
      const outputTokens = result.usage?.completionTokens ?? 0
      const reasoningTokens = result.usage?.reasoningTokens ?? 0
      const tokensUsed = result.usage?.totalTokens ?? (inputTokens + outputTokens + reasoningTokens)
      const finalContent = result.content || useDebateStore.getState().currentStreamingContent || ''

      // Add message manually with roundType
      useDebateStore.getState().addMessage({
        agentId: moderator.id,
        agentName: moderator.name,
        agentColor: moderator.color,
        agentModel: moderator.model,
        content: finalContent,
        tokensUsed,
        roundType: 'final_summary',
      })
      useDebateStore.setState({ currentStreamingContent: '' })
      useDebateStore.getState().addTokensUsed(tokensUsed)

      // Save to Firestore
      const promptText = JSON.stringify(apiMessages, null, 2)
      await saveMessageToDb(
        moderator.id,
        moderator.name,
        moderator.color,
        moderator.model,
        finalContent,
        tokensUsed,
        inputTokens,
        outputTokens,
        reasoningTokens,
        promptText,
        systemPrompt,
        'final_summary'
      )

      // Update debate status
      const currentDebateId = useDebateStore.getState().debateId
      if (currentDebateId) {
        await updateDebate(currentDebateId, { status: 'finished' })
      }

      await updateCredits(tokensUsed)
      setStatus('finished')
      setActiveAgent(null)
      return true
    } catch (error) {
      console.error('Error during final summary:', error)

      // Try to save partial content
      const partialContent = useDebateStore.getState().currentStreamingContent || ''
      if (partialContent.trim().length > 0) {
        const errorContent = partialContent + '\n\n[Summary was interrupted due to an error]'
        useDebateStore.getState().addMessage({
          agentId: moderator.id,
          agentName: moderator.name,
          agentColor: moderator.color,
          agentModel: moderator.model,
          content: errorContent,
          roundType: 'final_summary',
        })
        useDebateStore.setState({ currentStreamingContent: '' })
        await saveMessageToDb(
          moderator.id,
          moderator.name,
          moderator.color,
          moderator.model,
          errorContent,
          0, 0, 0, 0,
          JSON.stringify(apiMessages, null, 2),
          systemPrompt,
          'final_summary'
        )
        const currentDebateId = useDebateStore.getState().debateId
        if (currentDebateId) {
          await updateDebate(currentDebateId, { status: 'finished' })
        }
        setStatus('finished')
      } else {
        setStatus('paused')
      }
      setActiveAgent(null)
      return false
    }
  }, [setActiveAgent, setStatus, saveMessageToDb, updateCredits])

  // ============================================
  // MAIN DEBATE LOOP
  // ============================================

  const runDebateLoop = useCallback(async () => {
    const store = useDebateStore.getState()
    if (store.status !== 'running') return

    // Check if we've reached max rounds
    if (store.roundCount >= store.maxRounds) {
      await executeFinalSummaryRound()
      return
    }

    // Check if moderator already provided final summary
    const lastMessage = store.messages[store.messages.length - 1]
    if (lastMessage && lastMessage.agentId === 'moderator' && lastMessage.roundType === 'final_summary') {
      setStatus('finished')
      setActiveAgent(null)
      return
    }

    // Execute statement round
    const statementSuccess = await executeStatementRound()
    if (!statementSuccess) return // User turn or error

    // Check if we need moderator rounds after this statement
    const currentStore = useDebateStore.getState()
    const statementCount = countStatements(currentStore.messages)

    if (shouldRunModeratorRound(statementCount)) {
      // Run summary
      await executeSummaryRound()

      // Check if we also need escalation
      if (shouldRunEscalation(statementCount)) {
        await executeEscalationRound()
      }
    }

    // Check again if we've reached max rounds after this turn
    const storeAfterRounds = useDebateStore.getState()
    if (storeAfterRounds.roundCount >= storeAfterRounds.maxRounds) {
      await executeFinalSummaryRound()
      return
    }

    // Schedule next loop iteration
    if (storeAfterRounds.status === 'running') {
      setTimeout(() => {
        runDebateLoop()
      }, 1500)
    }
  }, [
    setActiveAgent,
    setStatus,
    executeStatementRound,
    executeSummaryRound,
    executeEscalationRound,
    executeFinalSummaryRound
  ])

  // Handle user submitting their message
  const handleUserSubmit = useCallback(async (content: string) => {
    if (!content.trim()) return

    const store = useDebateStore.getState()
    const userAgent = createUserAgent(store.userName)

    submitUserMessage(content)
    incrementRound()
    setActiveAgent(null)

    // Update debate roundCount in Firestore
    const storeAfterSubmit = useDebateStore.getState()
    if (storeAfterSubmit.debateId) {
      try {
        await updateDebate(storeAfterSubmit.debateId, { roundCount: storeAfterSubmit.roundCount })
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
        0, 0, 0, 0,
        undefined,
        undefined,
        'statement'
      )
    } catch (error) {
      console.error('Error saving user message to Firestore:', error)
    }

    // Check if we need moderator rounds after user message
    const storeAfterSave = useDebateStore.getState()
    const statementCount = countStatements(storeAfterSave.messages)

    if (shouldRunModeratorRound(statementCount)) {
      await executeSummaryRound()
      if (shouldRunEscalation(statementCount)) {
        await executeEscalationRound()
      }
    }

    // Continue debate
    const stateAfterMod = useDebateStore.getState()
    if (stateAfterMod.roundCount >= stateAfterMod.maxRounds) {
      await executeFinalSummaryRound()
    } else if (stateAfterMod.status === 'running') {
      setTimeout(() => {
        runDebateLoop()
      }, 1000)
    }
  }, [
    submitUserMessage,
    incrementRound,
    setActiveAgent,
    saveMessageToDb,
    executeSummaryRound,
    executeEscalationRound,
    executeFinalSummaryRound,
    runDebateLoop
  ])

  const startDebate = useCallback(async (): Promise<boolean> => {
    const store = useDebateStore.getState()
    if (!store.topic.trim()) return false

    if (store.selectedAgentIds.length < 2) {
      console.error('Cannot start debate: minimum 2 debaters required')
      return false
    }

    const authStore = useAuthStore.getState()
    if (!authStore.user) {
      console.error('Cannot start debate: user not authenticated')
      return false
    }

    const hasCredits = (authStore.profile?.creditsAvailable ?? 0) > 0
    if (!hasCredits) {
      return false
    }

    try {
      const avatarStore = useAvatarStore.getState()
      const allAvatars = avatarStore.getVisibleAvatars()
      const selectedAvatars = store.selectedAgentIds.length > 0
        ? allAvatars.filter(avatar => store.selectedAgentIds.includes(avatar.id))
        : []

      const selectedAgents = avatarsToAgents(selectedAvatars)
      const allAgents = [...selectedAgents, moderator]

      const debate = await createDebate(
        authStore.user.uid,
        store.topic,
        allAgents,
        store.language,
        store.maxRounds
      )

      setDebateId(debate.id)
      setStatus('running')
      runDebateLoop()
      return true
    } catch (error) {
      console.error('Error creating debate:', error)
      return false
    }
  }, [runDebateLoop, setStatus, setDebateId])

  const pauseDebate = useCallback(async () => {
    const store = useDebateStore.getState()
    setStatus('paused')

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

    if (store.status === 'finished') return

    const lastMessage = store.messages[store.messages.length - 1]
    if (lastMessage && lastMessage.agentId === 'moderator' && lastMessage.roundType === 'final_summary') {
      setStatus('finished')
      return
    }

    // Remove incomplete streaming messages
    const messages = store.messages
    const lastMsg = messages[messages.length - 1]
    if (lastMsg && lastMsg.isStreaming && lastMsg.content === '') {
      useDebateStore.setState({ messages: messages.slice(0, -1) })
    }

    setStatus('running')
    runDebateLoop()
  }, [runDebateLoop, setStatus])

  const resetDebate = useCallback(async () => {
    const store = useDebateStore.getState()

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
    if (store.debateId && store.messages.length > 0) return

    try {
      const debate = await getActiveDebate(authStore.user.uid)
      if (!debate) return

      const messages = await getMessages(debate.id)

      const convertedMessages = messages.map((msg: DebateMessage) => ({
        id: msg.id,
        agentId: msg.avatarId,
        agentName: msg.avatarName,
        agentColor: msg.avatarColor,
        agentModel: msg.avatarModel,
        content: msg.content,
        timestamp: msg.timestamp,
        tokensUsed: msg.tokensUsed,
        roundType: msg.roundType,
      }))

      store.reset()
      store.setDebateId(debate.id)
      store.setTopic(debate.title)
      store.setLanguage(debate.language)
      store.setMaxRounds(debate.maxRounds)
      store.setStatus(debate.status)

      convertedMessages.forEach(msg => {
        store.addMessage({
          agentId: msg.agentId,
          agentName: msg.agentName,
          agentColor: msg.agentColor,
          agentModel: msg.agentModel,
          content: msg.content,
          tokensUsed: msg.tokensUsed,
          roundType: msg.roundType,
        })
      })

      store.setRoundCount(debate.roundCount)

      const selectedIds = debate.avatarsSnapshot
        .filter(snapshot => snapshot.avatarId && snapshot.avatarId !== 'moderator' && snapshot.avatarId !== 'user')
        .map(snapshot => snapshot.avatarId!)
      store.setSelectedAgentIds(selectedIds)
    } catch (error) {
      console.error('Error loading debate:', error)
    }
  }, [])

  return {
    // State
    topic,
    messages,
    activeAgent,
    status,
    currentStreamingContent,
    roundCount,
    maxRounds,
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
