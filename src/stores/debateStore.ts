import { create } from 'zustand'
import type { Agent } from '../lib/agents'
import type { RoundType, ModeratorSummaryData, EscalationData } from '../lib/roundTypes'

export interface Message {
  id: string
  agentId: string
  agentName: string
  agentColor: string
  agentModel: string
  content: string
  timestamp: number
  tokensUsed?: number
  isStreaming?: boolean
  roundType?: RoundType // Round type: 'statement' | 'summary' | 'escalation' | 'final_summary'
}

export type DebateStatus = 'idle' | 'running' | 'paused' | 'finished'
export type DebateLanguage = 'en' | 'pl'

interface DebateState {
  // State
  debateId: string | null // Firestore debate ID
  topic: string
  language: DebateLanguage
  messages: Message[]
  activeAgent: Agent | null
  status: DebateStatus
  currentStreamingContent: string
  roundCount: number
  maxRounds: number

  // Credits tracking
  tokensUsedInSession: number // OpenAI tokens used this session
  creditsUsedInSession: number // Credits used (tokens / 1000)

  // User participation
  userName: string
  handRaised: boolean
  isUserTurn: boolean

  // Selected debaters
  selectedAgentIds: string[]

  // Moderator summary
  moderatorSummary: ModeratorSummaryData | null

  // Escalation data (one-time use)
  escalationData: EscalationData | null

  // Actions
  setDebateId: (id: string | null) => void
  setTopic: (topic: string) => void
  setLanguage: (language: DebateLanguage) => void
  setActiveAgent: (agent: Agent | null) => void
  setStatus: (status: DebateStatus) => void
  setMaxRounds: (rounds: number) => void
  setRoundCount: (count: number) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  updateStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  finalizeMessage: (tokensUsed?: number) => void
  addTokensUsed: (tokens: number) => void
  incrementRound: () => void
  reset: () => void

  // User actions
  setUserName: (name: string) => void
  toggleHandRaised: () => void
  setIsUserTurn: (isTurn: boolean) => void
  submitUserMessage: (content: string) => void

  // Debaters selection
  setSelectedAgentIds: (ids: string[]) => void
  toggleAgentSelection: (agentId: string) => void

  // Moderator summary
  setModeratorSummary: (summary: ModeratorSummaryData | null) => void

  // Escalation data
  setEscalationData: (escalation: EscalationData | null) => void
}

export const useDebateStore = create<DebateState>((set, get) => ({
  // Initial state
  debateId: null,
  topic: '',
  language: 'en',
  messages: [],
  activeAgent: null,
  status: 'idle',
  currentStreamingContent: '',
  roundCount: 0,
  maxRounds: 10,

  // Credits tracking
  tokensUsedInSession: 0,
  creditsUsedInSession: 0,

  // User participation
  userName: '',
  handRaised: false,
  isUserTurn: false,

  // Selected debaters (will be populated when avatars are loaded from Firestore)
  selectedAgentIds: [],

  // Moderator summary
  moderatorSummary: null,

  // Escalation data
  escalationData: null,

  // Actions
  setDebateId: (id) => set({ debateId: id }),

  setTopic: (topic) => set({ topic }),

  setLanguage: (language) => set({ language }),

  setActiveAgent: (agent) => set({ activeAgent: agent }),

  setStatus: (status) => set({ status }),

  setMaxRounds: (rounds) => set({ maxRounds: rounds }),

  setRoundCount: (count) => set({ roundCount: count }),

  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    // Clear streaming content atomically to prevent duplicate render frames
    set((state) => ({ messages: [...state.messages, newMessage], currentStreamingContent: '' }))
  },

  updateStreamingContent: (content) => set({ currentStreamingContent: content }),

  appendStreamingContent: (() => {
    // Throttle updates to reduce CPU usage during streaming
    // Accumulate chunks and update at most every frame (~16ms) using requestAnimationFrame
    let buffer = ''
    let rafId: number | null = null

    const flush = () => {
      // Only flush if currentStreamingContent is not empty (i.e. not cleared by addMessage)
      const current = get().currentStreamingContent
      if (buffer !== '' && current !== '') {
        set({ currentStreamingContent: buffer })
      }
      buffer = ''
      rafId = null
    }

    return (chunk: string) => {
      const state = get()
      if (buffer === '') {
        buffer = state.currentStreamingContent
      }
      buffer += chunk

      if (rafId === null) {
        rafId = requestAnimationFrame(flush)
      }
    }
  })(),

  finalizeMessage: (tokensUsed?: number) => {
    const { activeAgent, currentStreamingContent, messages } = get()
    if (activeAgent && currentStreamingContent) {
      // Find the last streaming message and update it instead of creating a new one
      const lastMessageIndex = messages.length - 1
      const lastMessage = messages[lastMessageIndex]
      
      if (lastMessage && lastMessage.isStreaming && lastMessage.agentId === activeAgent.id) {
        // Update existing streaming message
        set((state) => ({
          messages: state.messages.map((msg, idx) => 
            idx === lastMessageIndex
              ? { ...msg, content: currentStreamingContent, isStreaming: false, tokensUsed }
              : msg
          ),
          currentStreamingContent: '',
        }))
      } else {
        // No streaming message found, create a new one (fallback)
        const message: Message = {
          id: crypto.randomUUID(),
          agentId: activeAgent.id,
          agentName: activeAgent.name,
          agentColor: activeAgent.color,
          agentModel: activeAgent.model,
          content: currentStreamingContent,
          timestamp: Date.now(),
          tokensUsed,
        }
        set((state) => ({
          messages: [...state.messages, message],
          currentStreamingContent: '',
        }))
      }
    }
  },

  addTokensUsed: (tokens: number) =>
    set((state) => ({
      tokensUsedInSession: state.tokensUsedInSession + tokens,
      creditsUsedInSession: Math.ceil((state.tokensUsedInSession + tokens) / 1000),
    })),

  incrementRound: () =>
    set((state) => ({ roundCount: state.roundCount + 1 })),

  reset: () => {
    // Reset state (selected agents will be repopulated when avatars are loaded)
    set({
      debateId: null,
      topic: '',
      language: 'en',
      messages: [],
      activeAgent: null,
      status: 'idle',
      currentStreamingContent: '',
      roundCount: 0,
      tokensUsedInSession: 0,
      creditsUsedInSession: 0,
      handRaised: false,
      isUserTurn: false,
      selectedAgentIds: [],
      moderatorSummary: null,
      escalationData: null,
    })
  },
  
  // User actions
  setUserName: (name) => set({ userName: name }),
  
  toggleHandRaised: () => set((state) => ({ handRaised: !state.handRaised })),
  
  setIsUserTurn: (isTurn) => set({ isUserTurn: isTurn }),
  
  submitUserMessage: (content) => {
    const { userName } = get()
    const message: Message = {
      id: crypto.randomUUID(),
      agentId: 'user',
      agentName: userName || 'You',
      agentColor: '#ec4899', // pink-500
      agentModel: 'human',
      content,
      timestamp: Date.now(),
    }
    set((state) => ({
      messages: [...state.messages, message],
      isUserTurn: false,
      handRaised: false, // reset hand after speaking
    }))
  },

  // Debaters selection
  setSelectedAgentIds: (ids) => set({ selectedAgentIds: ids }),
  
  toggleAgentSelection: (agentId) => {
    const state = get()
    const isSelected = state.selectedAgentIds.includes(agentId)
    
    if (isSelected) {
      // Remove from selection (but keep minimum 2)
      if (state.selectedAgentIds.length > 2) {
        set({ selectedAgentIds: state.selectedAgentIds.filter(id => id !== agentId) })
      }
    } else {
      // Add to selection (max 10)
      if (state.selectedAgentIds.length < 10) {
        set({ selectedAgentIds: [...state.selectedAgentIds, agentId] })
      }
    }
  },

  // Moderator summary
  setModeratorSummary: (summary) => set({ moderatorSummary: summary }),

  // Escalation data
  setEscalationData: (escalation) => set({ escalationData: escalation }),
}))
