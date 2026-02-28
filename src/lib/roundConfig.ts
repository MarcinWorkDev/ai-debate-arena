// Round sequence configuration for debate architecture

import type { Message } from '../stores/debateStore'

// Configuration for when special rounds trigger
export interface RoundSequenceConfig {
  // After every N statements, run a summary
  summaryEvery: number

  // After every N statements, run summary + escalation
  escalationEvery: number

  // Maximum messages to include in summary context
  summaryContextSize: number

  // Maximum messages to include in statement context
  statementContextSize: number
}

// Default configuration - easily changeable
export const DEFAULT_ROUND_CONFIG: RoundSequenceConfig = {
  summaryEvery: 5,
  escalationEvery: 15,
  summaryContextSize: 40,
  statementContextSize: 20,
}

/**
 * Count statements from AI avatars (excludes moderator and user messages)
 */
export function countStatements(messages: Message[]): number {
  return messages.filter(m =>
    m.agentId !== 'moderator' &&
    m.agentId !== 'user'
  ).length
}

/**
 * Check if a moderator round (summary/escalation) should run after the current statement count.
 * Used to determine if we need to pause for moderator intervention.
 */
export function shouldRunModeratorRound(
  statementCount: number,
  config: RoundSequenceConfig = DEFAULT_ROUND_CONFIG
): boolean {
  if (statementCount <= 0) return false
  return statementCount % config.summaryEvery === 0
}

/**
 * Check if escalation should run (in addition to summary) at the current statement count.
 */
export function shouldRunEscalation(
  statementCount: number,
  config: RoundSequenceConfig = DEFAULT_ROUND_CONFIG
): boolean {
  if (statementCount <= 0) return false
  return statementCount % config.escalationEvery === 0
}
