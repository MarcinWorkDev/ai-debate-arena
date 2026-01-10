// Round type definitions for debate architecture

export type RoundType = 'statement' | 'summary' | 'escalation' | 'final_summary'

// Moderator summary data structure (JSON output from summary rounds)
export interface ModeratorSummaryData {
  core_disagreements: string[]
  points_of_tentative_agreement: string[]
  arguments_repeated_too_often: string[]
  missing_or_underexplored_angles: string[]
}
