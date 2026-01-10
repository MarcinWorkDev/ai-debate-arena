import { create } from 'zustand'
import type {
  Avatar,
  AvatarChangelog,
  AvatarSuggestion,
  AvatarSuggestionWithAvatarName,
} from '../lib/types/avatar'

interface AvatarState {
  // User data
  userAvatars: Avatar[]
  publicAvatars: Avatar[]

  // Admin data
  allAvatars: Avatar[]
  pendingPromotions: Avatar[]
  pendingSuggestions: AvatarSuggestionWithAvatarName[]
  unblockRequests: Avatar[]

  // Selected avatar for detail view
  selectedAvatar: Avatar | null
  selectedAvatarChangelog: AvatarChangelog[]
  selectedAvatarSuggestions: AvatarSuggestion[]

  // Loading states
  loading: boolean
  migrationComplete: boolean

  // Actions
  setUserAvatars: (avatars: Avatar[]) => void
  setPublicAvatars: (avatars: Avatar[]) => void
  setAllAvatars: (avatars: Avatar[]) => void
  setPendingPromotions: (avatars: Avatar[]) => void
  setPendingSuggestions: (suggestions: AvatarSuggestionWithAvatarName[]) => void
  setUnblockRequests: (avatars: Avatar[]) => void
  setSelectedAvatar: (avatar: Avatar | null) => void
  setSelectedAvatarChangelog: (changelog: AvatarChangelog[]) => void
  setSelectedAvatarSuggestions: (suggestions: AvatarSuggestion[]) => void
  setLoading: (loading: boolean) => void
  setMigrationComplete: (complete: boolean) => void

  // Computed helpers
  getVisibleAvatars: () => Avatar[]

  // Reset
  reset: () => void
}

export const useAvatarStore = create<AvatarState>((set, get) => ({
  // Initial state
  userAvatars: [],
  publicAvatars: [],
  allAvatars: [],
  pendingPromotions: [],
  pendingSuggestions: [],
  unblockRequests: [],
  selectedAvatar: null,
  selectedAvatarChangelog: [],
  selectedAvatarSuggestions: [],
  loading: false,
  migrationComplete: false,

  // Actions
  setUserAvatars: (avatars) => set({ userAvatars: avatars }),
  setPublicAvatars: (avatars) => set({ publicAvatars: avatars }),
  setAllAvatars: (avatars) => set({ allAvatars: avatars }),
  setPendingPromotions: (avatars) => set({ pendingPromotions: avatars }),
  setPendingSuggestions: (suggestions) => set({ pendingSuggestions: suggestions }),
  setUnblockRequests: (avatars) => set({ unblockRequests: avatars }),
  setSelectedAvatar: (avatar) => set({ selectedAvatar: avatar }),
  setSelectedAvatarChangelog: (changelog) => set({ selectedAvatarChangelog: changelog }),
  setSelectedAvatarSuggestions: (suggestions) => set({ selectedAvatarSuggestions: suggestions }),
  setLoading: (loading) => set({ loading }),
  setMigrationComplete: (complete) => set({ migrationComplete: complete }),

  // Computed: merge user avatars and public avatars, deduplicated
  getVisibleAvatars: () => {
    const { userAvatars, publicAvatars } = get()
    const allAvatars = [...userAvatars]

    for (const publicAvatar of publicAvatars) {
      if (!allAvatars.find((a) => a.id === publicAvatar.id)) {
        allAvatars.push(publicAvatar)
      }
    }

    // Filter out blocked avatars unless they belong to the user
    return allAvatars.filter(
      (a) => a.status === 'active' || userAvatars.some((ua) => ua.id === a.id)
    )
  },

  reset: () =>
    set({
      userAvatars: [],
      publicAvatars: [],
      allAvatars: [],
      pendingPromotions: [],
      pendingSuggestions: [],
      unblockRequests: [],
      selectedAvatar: null,
      selectedAvatarChangelog: [],
      selectedAvatarSuggestions: [],
      loading: false,
    }),
}))
