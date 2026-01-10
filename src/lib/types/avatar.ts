// Avatar types for Firestore storage

export type AvatarVisibility = 'private' | 'public'
export type AvatarStatus = 'active' | 'blocked'
export type PromotionStatus = 'none' | 'pending' | 'approved' | 'rejected'

export interface Avatar {
  id: string

  // Core agent properties
  name: string
  color: string
  model: string
  persona: string
  isModerator?: boolean
  tags?: string[]

  // Ownership & visibility
  authorEmail: string
  authorUid: string
  visibility: AvatarVisibility

  // Status
  status: AvatarStatus
  blockedReason?: string
  blockedAt?: Date
  blockedBy?: string

  // Unblock request
  unblockRequested?: boolean
  unblockRequestedAt?: Date
  unblockRequestReason?: string

  // Promotion workflow (private -> public)
  promotionStatus: PromotionStatus
  promotionRequestedAt?: Date
  promotionApprovedAt?: Date
  promotionApprovedBy?: string
  promotionRejectedAt?: Date
  promotionRejectedBy?: string
  promotionRejectedReason?: string

  // Fork tracking
  forkedFromId?: string
  forkedFromName?: string

  // Migration tracking
  isMigrated?: boolean
  originalAgentId?: string

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

// Changelog types
export type ChangelogAction =
  | 'created'
  | 'updated'
  | 'promoted_request'
  | 'promoted_approved'
  | 'promoted_rejected'
  | 'blocked'
  | 'unblocked'
  | 'unblock_requested'
  | 'suggestion_submitted'
  | 'suggestion_approved'
  | 'suggestion_rejected'
  | 'forked'

export interface ChangelogEntry {
  field: string
  oldValue: string | null
  newValue: string | null
}

export interface AvatarChangelog {
  id: string
  avatarId: string
  action: ChangelogAction
  actorEmail: string
  actorUid: string
  changes?: ChangelogEntry[]
  reason?: string
  suggestionId?: string
  timestamp: Date
}

// Suggestion types
export type SuggestionStatus = 'pending' | 'approved' | 'rejected'

export interface SuggestedChanges {
  name?: string
  color?: string
  model?: string
  persona?: string
  tags?: string[]
}

export interface AvatarSuggestion {
  id: string
  avatarId: string
  suggestedChanges: SuggestedChanges
  submitterEmail: string
  submitterUid: string
  submissionReason?: string
  status: SuggestionStatus
  reviewedAt?: Date
  reviewedBy?: string
  rejectionReason?: string
  createdAt: Date
}

// Input types for creating/updating avatars
export interface CreateAvatarInput {
  name: string
  color: string
  model: string
  persona: string
  isModerator?: boolean
  tags?: string[]
}

export interface UpdateAvatarInput {
  name?: string
  color?: string
  model?: string
  persona?: string
  tags?: string[]
}

// Extended types for admin views
export interface AvatarSuggestionWithAvatarName extends AvatarSuggestion {
  avatarName: string
}
