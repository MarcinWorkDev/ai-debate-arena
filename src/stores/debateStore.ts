import { create } from 'zustand'
import type { Agent } from '../lib/agents'

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
  userName: 'You',
  handRaised: false,
  isUserTurn: false,

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
    set((state) => ({ messages: [...state.messages, newMessage] }))
  },

  updateStreamingContent: (content) => set({ currentStreamingContent: content }),

  appendStreamingContent: (chunk) =>
    set((state) => ({
      currentStreamingContent: state.currentStreamingContent + chunk
    })),

  finalizeMessage: (tokensUsed?: number) => {
    const { activeAgent, currentStreamingContent } = get()
    if (activeAgent && currentStreamingContent) {
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
  },

  addTokensUsed: (tokens: number) =>
    set((state) => ({
      tokensUsedInSession: state.tokensUsedInSession + tokens,
      creditsUsedInSession: Math.ceil((state.tokensUsedInSession + tokens) / 1000),
    })),

  incrementRound: () =>
    set((state) => ({ roundCount: state.roundCount + 1 })),

  reset: () => set({
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
  }),
  
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
}))
