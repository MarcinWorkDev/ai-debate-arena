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

// Moderator sits at the front (bottom of screen)
export const moderator: Agent = {
  id: 'moderator',
  name: 'Moderator',
  color: '#ffffff', // white - stands out
  model: import.meta.env.VITE_MODERATOR_MODEL || 'anthropic/claude-opus-4.6',
  persona: 'You are a neutral debate moderator. Summarize the key arguments from all participants, identify points of agreement and disagreement, and provide a balanced conclusion. Be comprehensive but concise.',
  position: [0, 0, TABLE_RADIUS], // front side
  rotation: Math.PI, // facing the debaters (toward -Z direction)
  isModerator: true,
  active: true
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
    active: avatar.status === 'active',
  }))
}

// Better speaker selection - round-robin with slight randomization
// Now accepts handRaised to prioritize user and list of available agents
let speakerIndex = -1
export const selectNextSpeaker = (
  lastSpeakerId: string | null,
  handRaised: boolean = false,
  availableAgents: Agent[]
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
