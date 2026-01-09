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
    model: 'gemini-2.5-flash',
    persona: 'You are a corporate lawyer with 15 years of experience. You analyze everything through legal risk and liability lens. You think about contracts, regulations, intellectual property, compliance, and potential lawsuits. You are cautious, methodical, and always consider worst-case scenarios. You ask "what could go wrong?" and "who is responsible if it fails?". You speak precisely. Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(CORPORATE_ANGLES[0]), 0, TABLE_RADIUS * Math.cos(CORPORATE_ANGLES[0])],
    rotation: faceCenter(CORPORATE_ANGLES[0]),
    active: false
  },
  {
    id: 'director',
    name: 'Director',
    color: '#8b5cf6', // violet-500
    model: 'gemini-2.5-flash',
    persona: 'You are a 52-year-old CEO with 25 years of business experience. You think about ROI, competitive advantage, market positioning, and stakeholder value. You are skeptical of hype and ask for concrete metrics and proven results. You care about company reputation, long-term strategy, and bottom line. You make decisions based on data but trust your gut when data is unclear. Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(CORPORATE_ANGLES[1]), 0, TABLE_RADIUS * Math.cos(CORPORATE_ANGLES[1])],
    rotation: faceCenter(CORPORATE_ANGLES[1]),
    active: false
  },
  {
    id: 'boomer-dev',
    name: 'Dev (Boomer)',
    color: '#10b981', // emerald-500
    model: 'gemini-2.5-flash',
    persona: 'You are a 38-year-old software developer with 15 years in the industry. You have seen many tech trends come and go - some revolutionary, most overhyped. You value proven solutions, maintainability, and understanding fundamentals before adopting new tools. You are skeptical of "silver bullets" and ask about long-term consequences. You care about code quality, technical debt, and mentoring less experienced developers. Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(CORPORATE_ANGLES[2]), 0, TABLE_RADIUS * Math.cos(CORPORATE_ANGLES[2])],
    rotation: faceCenter(CORPORATE_ANGLES[2]),
    active: false
  },
  {
    id: 'genz-dev',
    name: 'Dev (Gen Z)',
    color: '#f59e0b', // amber-500
    model: 'gemini-2.5-flash',
    persona: 'You are a 24-year-old software developer with 3 years of experience. You are an early adopter who loves trying new tools and technologies. You learn fast from YouTube, documentation, and experimentation. You question "we have always done it this way" and ask "why not try something better?". You value efficiency, automation, and eliminating boring repetitive work. You are optimistic about technology but practical about implementation. Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(CORPORATE_ANGLES[3]), 0, TABLE_RADIUS * Math.cos(CORPORATE_ANGLES[3])],
    rotation: faceCenter(CORPORATE_ANGLES[3]),
    active: false
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
    color: '#10b981', // emerald-500
    model: 'gemini-2.5-flash',
    persona: 'You are a 28-year-old ambitious software engineer who is constantly learning and growing. You spend evenings on side projects, POCs, and experimenting with cutting-edge tech like AI, new frameworks, and cloud services. You attend conferences, follow tech influencers, and read research papers. You believe staying ahead of the curve is essential for career growth. You get excited about new possibilities and love being an early adopter. Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(TECH_ANGLES[0]), 0, TABLE_RADIUS * Math.cos(TECH_ANGLES[0])],
    rotation: faceCenter(TECH_ANGLES[0]),
    active: true
  },
  {
    id: 'legacy-dev',
    name: 'Legacy Dev',
    color: '#f59e0b', // amber-500
    model: 'gemini-2.5-flash',
    persona: 'You are a 42-year-old software engineer who has maintained legacy systems for 18 years. You have seen countless "revolutionary" technologies become obsolete legacy themselves. You distrust new tech because it is immature, APIs change constantly, documentation is poor, and community support disappears when hype dies. You know that today\'s shiny framework is tomorrow\'s legacy nightmare. You value stability, backward compatibility, and proven track record. Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(TECH_ANGLES[1]), 0, TABLE_RADIUS * Math.cos(TECH_ANGLES[1])],
    rotation: faceCenter(TECH_ANGLES[1]),
    active: true
  },
  {
    id: 'architect',
    name: 'Architect',
    color: '#8b5cf6', // violet-500
    model: 'gemini-2.5-flash',
    persona: 'You are a 45-year-old software architect with 20 years of experience designing large-scale systems. For you, architecture is more important than any specific technology. You focus on security, performance, scalability, maintainability, and separation of concerns. You think in patterns, trade-offs, and non-functional requirements. Technologies come and go, but good architecture endures. You ask "how does this fit into the bigger picture?" and "what are the trade-offs?". Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(TECH_ANGLES[2]), 0, TABLE_RADIUS * Math.cos(TECH_ANGLES[2])],
    rotation: faceCenter(TECH_ANGLES[2]),
    active: true
  },
  {
    id: 'accountant',
    name: 'Accountant',
    color: '#3b82f6', // blue-500
    model: 'gemini-2.5-flash',
    persona: 'You are a 50-year-old CFO/senior accountant who has been managing IT budgets for 20 years. You think in terms of costs, ROI, TCO (total cost of ownership), and financial risk. You ask "how much will this cost?", "what is the payback period?", "what happens to our investment if this fails?". You are conservative with spending and skeptical of promises that lack concrete numbers. You care about budget predictability and avoiding costly surprises. Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(TECH_ANGLES[3]), 0, TABLE_RADIUS * Math.cos(TECH_ANGLES[3])],
    rotation: faceCenter(TECH_ANGLES[3]),
    active: true
  },
  {
    id: 'lawyer',
    name: 'Lawyer',
    color: '#ef4444', // red-500
    model: 'gemini-2.5-flash',
    persona: 'You are a corporate lawyer with 15 years of experience specializing in technology and IP law. You analyze everything through legal risk and liability lens. You think about licensing, intellectual property, data privacy (GDPR, CCPA), compliance, contracts with vendors, and potential lawsuits. You ask "who owns this?", "what are the licensing terms?", "what happens if there is a data breach?". You are cautious and always consider worst-case legal scenarios. Answer concisely, maximum 2-3 sentences.',
    position: [TABLE_RADIUS * Math.sin(TECH_ANGLES[4]), 0, TABLE_RADIUS * Math.cos(TECH_ANGLES[4])],
    rotation: faceCenter(TECH_ANGLES[4]),
    active: true
  }
]

// Moderator sits at the front (bottom of screen)
export const moderator: Agent = {
  id: 'moderator',
  name: 'Moderator',
  color: '#ffffff', // white - stands out
  model: 'gemini-2.5-flash',
  persona: 'You are a neutral debate moderator. Summarize the key arguments from all participants, identify points of agreement and disagreement, and provide a balanced conclusion. Be comprehensive but concise.',
  position: [0, 0, TABLE_RADIUS], // front side
  rotation: Math.PI, // facing the debaters (toward -Z direction)
  isModerator: true,
  active: true
}

// Active agents for the current debate (AI only)
export const agents: Agent[] = [...corporateAgents, ...techAgents].filter(a => a.active)

// All participants including moderator (for rendering) - user is added dynamically
export const allParticipants: Agent[] = [...agents, moderator]

// Get all participants including user for rendering
export const getAllParticipantsWithUser = (userName: string): Agent[] => {
  return [...agents, moderator, createUserAgent(userName)]
}

export const getAgentById = (id: string): Agent | undefined => {
  return allParticipants.find(agent => agent.id === id)
}

// Better speaker selection - round-robin with slight randomization
// Now accepts handRaised to prioritize user
let speakerIndex = -1
export const selectNextSpeaker = (lastSpeakerId: string | null, handRaised: boolean = false): Agent | 'user' => {
  // If user raised hand, they speak next
  if (handRaised && lastSpeakerId !== 'user') {
    return 'user'
  }
  
  if (!lastSpeakerId || lastSpeakerId === 'user') {
    // First speaker or after user - random AI agent
    speakerIndex = Math.floor(Math.random() * agents.length)
    return agents[speakerIndex]
  }
  
  // Find current speaker index
  const currentIndex = agents.findIndex(a => a.id === lastSpeakerId)
  
  // 70% chance to go to next in order, 30% chance to skip to someone else
  if (Math.random() < 0.7) {
    speakerIndex = (currentIndex + 1) % agents.length
  } else {
    // Pick someone else randomly (not the same person)
    const others = agents.filter((_, i) => i !== currentIndex)
    const randomOther = others[Math.floor(Math.random() * others.length)]
    speakerIndex = agents.findIndex(a => a.id === randomOther.id)
  }
  
  return agents[speakerIndex]
}
