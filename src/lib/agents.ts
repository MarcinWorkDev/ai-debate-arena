export interface Agent {
  id: string
  name: string
  color: string
  model: string
  persona: string
  position: [number, number, number]
  rotation: number // Y rotation to face table center
  isModerator?: boolean
  isHuman?: boolean
  active: boolean // whether this agent participates in debates
}

const TABLE_RADIUS = 3.2

// Helper to calculate rotation to face table center (0, 0, 0)
const faceCenter = (angle: number): number => {
  // Agent needs to rotate to face opposite direction of their position angle
  return angle + Math.PI
}

// Calculate angles for N debaters spread evenly at the back
const getDebaterAngles = (count: number): number[] => {
  if (count === 0) return []
  if (count === 1) return [Math.PI] // Single agent sits at the back
  
  const spread = 0.66 // total spread (from -0.33 to +0.33)
  const step = spread / (count - 1)
  return Array.from({ length: count }, (_, i) => (-0.33 + i * step + 1) * Math.PI)
}

// User agent - sits at the front-right
const USER_ANGLE = 0.25 * Math.PI // front-right position
export const createUserAgent = (userName: string): Agent => ({
  id: 'user',
  name: userName || 'You',
  color: '#ec4899', // pink-500
  model: 'human',
  persona: '',
  position: [TABLE_RADIUS * Math.sin(USER_ANGLE), 0, TABLE_RADIUS * Math.cos(USER_ANGLE)],
  rotation: faceCenter(USER_ANGLE),
  isHuman: true,
  active: true
})

// ============================================
// TABLE 1: Corporate Debate (INACTIVE)
// ============================================
const CORPORATE_ANGLES = getDebaterAngles(4)

export const corporateAgents: Agent[] = [
  {
    id: 'lawyer',
    name: 'Lawyer',
    color: '#3b82f6', // blue-500
    model: 'gpt-4o',
    persona: 'You are a corporate lawyer with 15 years of experience. You analyze everything through legal risk and liability lens. You think about contracts, regulations, intellectual property, compliance, and potential lawsuits. You are cautious, methodical, and always consider worst-case scenarios. You ask "what could go wrong?" and "who is responsible if it fails?". You speak precisely. Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(CORPORATE_ANGLES[0]), 0, TABLE_RADIUS * Math.cos(CORPORATE_ANGLES[0])],
    rotation: faceCenter(CORPORATE_ANGLES[0]),
    active: true
  },
  {
    id: 'director',
    name: 'Director',
    color: '#8b5cf6', // violet-500
    model: 'gpt-4o',
    persona: 'You are a 52-year-old CEO with 25 years of business experience. You think about ROI, competitive advantage, market positioning, and stakeholder value. You are skeptical of hype and ask for concrete metrics and proven results. You care about company reputation, long-term strategy, and bottom line. You make decisions based on data but trust your gut when data is unclear. Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(CORPORATE_ANGLES[1]), 0, TABLE_RADIUS * Math.cos(CORPORATE_ANGLES[1])],
    rotation: faceCenter(CORPORATE_ANGLES[1]),
    active: true
  },
  {
    id: 'boomer-dev',
    name: 'Dev (Boomer)',
    color: '#10b981', // emerald-500
    model: 'gpt-4o',
    persona: 'You are a 38-year-old software developer with 15 years in the industry. You have seen many tech trends come and go - some revolutionary, most overhyped. You value proven solutions, maintainability, and understanding fundamentals before adopting new tools. You are skeptical of "silver bullets" and ask about long-term consequences. You care about code quality, technical debt, and mentoring less experienced developers. Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(CORPORATE_ANGLES[2]), 0, TABLE_RADIUS * Math.cos(CORPORATE_ANGLES[2])],
    rotation: faceCenter(CORPORATE_ANGLES[2]),
    active: true
  },
  {
    id: 'genz-dev',
    name: 'Dev (Gen Z)',
    color: '#f59e0b', // amber-500
    model: 'gpt-4o',
    persona: 'You are a 24-year-old software developer with 3 years of experience. You are an early adopter who loves trying new tools and technologies. You learn fast from YouTube, documentation, and experimentation. You question "we have always done it this way" and ask "why not try something better?". You value efficiency, automation, and eliminating boring repetitive work. You are optimistic about technology but practical about implementation. Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(CORPORATE_ANGLES[3]), 0, TABLE_RADIUS * Math.cos(CORPORATE_ANGLES[3])],
    rotation: faceCenter(CORPORATE_ANGLES[3]),
    active: true
  }
]

// ============================================
// TABLE 2: Tech Team Debate (ACTIVE)
// ============================================
const TECH_ANGLES = getDebaterAngles(5)

export const techAgents: Agent[] = [
  {
    id: 'ambitious-dev',
    name: 'Ambitious Dev',
    color: '#06b6d4', // cyan-500
    model: 'gpt-4o',
    persona: 'You are a 28-year-old ambitious software engineer who is constantly learning and growing. You spend evenings on side projects, POCs, and experimenting with cutting-edge tech like AI, new frameworks, and cloud services. You attend conferences, follow tech influencers, and read research papers. You believe staying ahead of the curve is essential for career growth. You get excited about new possibilities and love being an early adopter. Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(TECH_ANGLES[0]), 0, TABLE_RADIUS * Math.cos(TECH_ANGLES[0])],
    rotation: faceCenter(TECH_ANGLES[0]),
    active: false
  },
  {
    id: 'legacy-dev',
    name: 'Legacy Dev',
    color: '#f97316', // orange-500
    model: 'gpt-4o',
    persona: 'You are a 42-year-old software engineer who has maintained legacy systems for 18 years. You have seen countless "revolutionary" technologies become obsolete legacy themselves. You distrust new tech because it is immature, APIs change constantly, documentation is poor, and community support disappears when hype dies. You know that today\'s shiny framework is tomorrow\'s legacy nightmare. You value stability, backward compatibility, and proven track record. Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(TECH_ANGLES[1]), 0, TABLE_RADIUS * Math.cos(TECH_ANGLES[1])],
    rotation: faceCenter(TECH_ANGLES[1]),
    active: false
  },
  {
    id: 'architect',
    name: 'Architect',
    color: '#a855f7', // purple-500
    model: 'gpt-4o',
    persona: 'You are a 45-year-old software architect with 20 years of experience designing large-scale systems. For you, architecture is more important than any specific technology. You focus on security, performance, scalability, maintainability, and separation of concerns. You think in patterns, trade-offs, and non-functional requirements. Technologies come and go, but good architecture endures. You ask "how does this fit into the bigger picture?" and "what are the trade-offs?". Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(TECH_ANGLES[2]), 0, TABLE_RADIUS * Math.cos(TECH_ANGLES[2])],
    rotation: faceCenter(TECH_ANGLES[2]),
    active: false
  },
  {
    id: 'accountant',
    name: 'Accountant',
    color: '#6366f1', // indigo-500
    model: 'gpt-4o',
    persona: 'You are a 50-year-old CFO/senior accountant who has been managing IT budgets for 20 years. You think in terms of costs, ROI, TCO (total cost of ownership), and financial risk. You ask "how much will this cost?", "what is the payback period?", "what happens to our investment if this fails?". You are conservative with spending and skeptical of promises that lack concrete numbers. You care about budget predictability and avoiding costly surprises. Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(TECH_ANGLES[3]), 0, TABLE_RADIUS * Math.cos(TECH_ANGLES[3])],
    rotation: faceCenter(TECH_ANGLES[3]),
    active: false
  },
  {
    id: 'tech-lawyer',
    name: 'Tech Lawyer',
    color: '#ef4444', // red-500
    model: 'gpt-4o',
    persona: 'You are a corporate lawyer with 15 years of experience specializing in technology and IP law. You analyze everything through legal risk and liability lens. You think about licensing, intellectual property, data privacy (GDPR, CCPA), compliance, contracts with vendors, and potential lawsuits. You ask "who owns this?", "what are the licensing terms?", "what happens if there is a data breach?". You are cautious and always consider worst-case legal scenarios. Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(TECH_ANGLES[4]), 0, TABLE_RADIUS * Math.cos(TECH_ANGLES[4])],
    rotation: faceCenter(TECH_ANGLES[4]),
    active: false
  }
]

// Moderator sits at the front (bottom of screen)
export const moderator: Agent = {
  id: 'moderator',
  name: 'Moderator',
  color: '#ffffff', // white - stands out
  model: 'gpt-4o',
  persona: 'You are a neutral debate moderator. Summarize the key arguments from all participants, identify points of agreement and disagreement, and provide a balanced conclusion. Be comprehensive but concise.',
  position: [0, 0, TABLE_RADIUS], // front side
  rotation: Math.PI, // facing the debaters (toward -Z direction)
  isModerator: true,
  active: true
}

// Active agents for the current debate (AI only)
export const agents: Agent[] = [...corporateAgents, ...techAgents].filter(a => a.active)

// All available agents (excluding moderator and user)
export const allAvailableAgents: Agent[] = [...corporateAgents, ...techAgents]

// All participants including moderator (for rendering) - user is added dynamically
export const allParticipants: Agent[] = [...agents, moderator]

// Get all participants including user for rendering
export const getAllParticipantsWithUser = (userName: string): Agent[] => {
  return [...agents, moderator, createUserAgent(userName)]
}

// Calculate positions for selected agents dynamically
export const calculatePositionsForAgents = (selectedAgents: Agent[]): Agent[] => {
  if (selectedAgents.length === 0) return selectedAgents
  
  // Calculate angles for selected agents
  const angles = getDebaterAngles(selectedAgents.length)
  
  // Update positions for selected agents
  return selectedAgents.map((agent, index) => ({
    ...agent,
    position: [
      TABLE_RADIUS * Math.sin(angles[index]),
      0,
      TABLE_RADIUS * Math.cos(angles[index])
    ] as [number, number, number],
    rotation: faceCenter(angles[index]),
  }))
}

export const getAgentById = (id: string): Agent | undefined => {
  return allParticipants.find(agent => agent.id === id)
}

// Import Avatar type from types/avatar.ts for conversion
import type { Avatar } from './types/avatar'

// Convert Avatar (from Firestore) to Agent (for 3D scene)
export function avatarToAgent(avatar: Avatar, position: [number, number, number], rotation: number): Agent {
  return {
    id: avatar.id,
    name: avatar.name,
    color: avatar.color,
    model: avatar.model,
    persona: avatar.persona,
    position,
    rotation,
    isModerator: avatar.isModerator,
    active: avatar.status === 'active',
  }
}

// Convert multiple avatars to agents with calculated positions
export function avatarsToAgents(avatars: Avatar[]): Agent[] {
  if (avatars.length === 0) return []

  const angles = getDebaterAngles(avatars.length)

  return avatars.map((avatar, index) => ({
    id: avatar.id,
    name: avatar.name,
    color: avatar.color,
    model: avatar.model,
    persona: avatar.persona,
    position: [
      TABLE_RADIUS * Math.sin(angles[index]),
      0,
      TABLE_RADIUS * Math.cos(angles[index])
    ] as [number, number, number],
    rotation: faceCenter(angles[index]),
    isModerator: avatar.isModerator,
    active: avatar.status === 'active',
  }))
}

// Better speaker selection - round-robin with slight randomization
// Now accepts handRaised to prioritize user and list of available agents
let speakerIndex = -1
export const selectNextSpeaker = (
  lastSpeakerId: string | null,
  handRaised: boolean = false,
  availableAgents: Agent[] = agents
): Agent | 'user' => {
  // If user raised hand, they speak next
  if (handRaised && lastSpeakerId !== 'user') {
    return 'user'
  }
  
  if (!lastSpeakerId || lastSpeakerId === 'user') {
    // First speaker or after user - random AI agent
    speakerIndex = Math.floor(Math.random() * availableAgents.length)
    return availableAgents[speakerIndex]
  }
  
  // Find current speaker index
  const currentIndex = availableAgents.findIndex(a => a.id === lastSpeakerId)
  
  // 70% chance to go to next in order, 30% chance to skip to someone else
  if (Math.random() < 0.7) {
    speakerIndex = (currentIndex + 1) % availableAgents.length
  } else {
    // Pick someone else randomly (not the same person)
    const others = availableAgents.filter((_, i) => i !== currentIndex)
    const randomOther = others[Math.floor(Math.random() * others.length)]
    speakerIndex = availableAgents.findIndex(a => a.id === randomOther.id)
  }
  
  return availableAgents[speakerIndex]
}
