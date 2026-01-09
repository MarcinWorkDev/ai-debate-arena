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
  isStreaming?: boolean
}

export type DebateStatus = 'idle' | 'running' | 'paused' | 'finished'

interface DebateState {
  // State
  topic: string
  messages: Message[]
  activeAgent: Agent | null
  status: DebateStatus
  currentStreamingContent: string
  roundCount: number
  maxRounds: number

  // Actions
  setTopic: (topic: string) => void
  setActiveAgent: (agent: Agent | null) => void
  setStatus: (status: DebateStatus) => void
  setMaxRounds: (rounds: number) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  updateStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  finalizeMessage: () => void
  incrementRound: () => void
  reset: () => void
}

export const useDebateStore = create<DebateState>((set, get) => ({
  // Initial state
  topic: '',
  messages: [],
  activeAgent: null,
  status: 'idle',
  currentStreamingContent: '',
  roundCount: 0,
  maxRounds: 30,

  // Actions
  setTopic: (topic) => set({ topic }),

  setActiveAgent: (agent) => set({ activeAgent: agent }),

  setStatus: (status) => set({ status }),

  setMaxRounds: (rounds) => set({ maxRounds: rounds }),

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

  finalizeMessage: () => {
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
      }
      set((state) => ({
        messages: [...state.messages, message],
        currentStreamingContent: '',
      }))
    }
  },

  incrementRound: () => 
    set((state) => ({ roundCount: state.roundCount + 1 })),

  reset: () => set({
    topic: '',
    messages: [],
    activeAgent: null,
    status: 'idle',
    currentStreamingContent: '',
    roundCount: 0,
  }),
}))
