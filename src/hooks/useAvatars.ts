import { useCallback } from 'react'
import { useAvatarStore } from '../stores/avatarStore'
import { useAuthStore } from '../stores/authStore'
import type { CreateAvatarInput, UpdateAvatarInput, SuggestedChanges } from '../lib/types/avatar'
import * as avatarDb from '../lib/avatarDb'

export function useAvatars() {
  const {
    userAvatars,
    publicAvatars,
    allAvatars,
    pendingPromotions,
    pendingSuggestions,
    unblockRequests,
    selectedAvatar,
    selectedAvatarChangelog,
    selectedAvatarSuggestions,
    loading,
    getVisibleAvatars,
  } = useAvatarStore()

  const { user, profile } = useAuthStore()

  // ============================================
  // Load functions
  // ============================================

  const loadUserAvatars = useCallback(async () => {
    if (!user) return
    const store = useAvatarStore.getState()
    store.setLoading(true)
    try {
      const avatars = await avatarDb.getUserAvatars(user.uid)
      store.setUserAvatars(avatars)
    } catch (err) {
      console.error('Error loading user avatars:', err)
    } finally {
      store.setLoading(false)
    }
  }, [user])

  const loadPublicAvatars = useCallback(async () => {
    const store = useAvatarStore.getState()
    store.setLoading(true)
    try {
      const avatars = await avatarDb.getPublicAvatars()
      store.setPublicAvatars(avatars)
    } catch (err) {
      console.error('Error loading public avatars:', err)
    } finally {
      store.setLoading(false)
    }
  }, [])

  const loadAllAvatars = useCallback(async () => {
    if (!profile?.isAdmin) return
    const store = useAvatarStore.getState()
    store.setLoading(true)
    try {
      const avatars = await avatarDb.getAllAvatars()
      store.setAllAvatars(avatars)
    } catch (err) {
      console.error('Error loading all avatars:', err)
    } finally {
      store.setLoading(false)
    }
  }, [profile?.isAdmin])

  const loadPendingPromotions = useCallback(async () => {
    if (!profile?.isAdmin) return
    const store = useAvatarStore.getState()
    try {
      const avatars = await avatarDb.getPendingPromotions()
      store.setPendingPromotions(avatars)
    } catch (err) {
      console.error('Error loading pending promotions:', err)
    }
  }, [profile?.isAdmin])

  const loadPendingSuggestions = useCallback(async () => {
    if (!profile?.isAdmin) return
    const store = useAvatarStore.getState()
    try {
      const suggestions = await avatarDb.getAllPendingSuggestions()
      store.setPendingSuggestions(suggestions)
    } catch (err) {
      console.error('Error loading pending suggestions:', err)
    }
  }, [profile?.isAdmin])

  const loadUnblockRequests = useCallback(async () => {
    if (!profile?.isAdmin) return
    const store = useAvatarStore.getState()
    try {
      const avatars = await avatarDb.getUnblockRequests()
      store.setUnblockRequests(avatars)
    } catch (err) {
      console.error('Error loading unblock requests:', err)
    }
  }, [profile?.isAdmin])

  const loadAvatarDetails = useCallback(async (avatarId: string) => {
    const store = useAvatarStore.getState()
    store.setLoading(true)
    try {
      const [avatar, changelog, suggestions] = await Promise.all([
        avatarDb.getAvatar(avatarId),
        avatarDb.getAvatarChangelog(avatarId),
        avatarDb.getAvatarSuggestions(avatarId),
      ])
      store.setSelectedAvatar(avatar)
      store.setSelectedAvatarChangelog(changelog)
      store.setSelectedAvatarSuggestions(suggestions)
    } catch (err) {
      console.error('Error loading avatar details:', err)
      store.setLoading(false)
      throw err
    } finally {
      store.setLoading(false)
    }
  }, [])

  const loadAdminData = useCallback(async () => {
    if (!profile?.isAdmin) return
    await Promise.all([
      loadAllAvatars(),
      loadPendingPromotions(),
      loadPendingSuggestions(),
      loadUnblockRequests(),
    ])
  }, [profile?.isAdmin, loadAllAvatars, loadPendingPromotions, loadPendingSuggestions, loadUnblockRequests])

  // ============================================
  // CRUD functions
  // ============================================

  const createAvatar = useCallback(
    async (data: CreateAvatarInput) => {
      if (!user?.email) throw new Error('Not authenticated')
      const avatar = await avatarDb.createAvatar(user.uid, user.email, data)
      await loadUserAvatars()
      return avatar
    },
    [user, loadUserAvatars]
  )

  const updateAvatar = useCallback(
    async (avatarId: string, updates: UpdateAvatarInput) => {
      if (!user?.email) throw new Error('Not authenticated')
      await avatarDb.updateAvatar(avatarId, updates, user.uid, user.email)
      await loadUserAvatars()
      await loadPublicAvatars()
    },
    [user, loadUserAvatars, loadPublicAvatars]
  )

  const deleteAvatar = useCallback(
    async (avatarId: string) => {
      if (!user) throw new Error('Not authenticated')
      await avatarDb.deleteAvatar(avatarId, user.uid)
      await loadUserAvatars()
    },
    [user, loadUserAvatars]
  )

  // ============================================
  // Promotion functions
  // ============================================

  const requestPromotion = useCallback(
    async (avatarId: string) => {
      if (!user?.email) throw new Error('Not authenticated')
      await avatarDb.requestPromotion(avatarId, user.uid, user.email)
      await loadUserAvatars()
    },
    [user, loadUserAvatars]
  )

  const approvePromotion = useCallback(
    async (avatarId: string) => {
      if (!user?.email || !profile?.isAdmin) throw new Error('Not authorized')
      await avatarDb.approvePromotion(avatarId, user.uid, user.email)
      await loadPendingPromotions()
      await loadAllAvatars()
      await loadPublicAvatars()
    },
    [user, profile?.isAdmin, loadPendingPromotions, loadAllAvatars, loadPublicAvatars]
  )

  const rejectPromotion = useCallback(
    async (avatarId: string, reason: string) => {
      if (!user?.email || !profile?.isAdmin) throw new Error('Not authorized')
      await avatarDb.rejectPromotion(avatarId, user.uid, user.email, reason)
      await loadPendingPromotions()
      await loadAllAvatars()
    },
    [user, profile?.isAdmin, loadPendingPromotions, loadAllAvatars]
  )

  // ============================================
  // Blocking functions
  // ============================================

  const blockAvatar = useCallback(
    async (avatarId: string, reason: string) => {
      if (!user?.email || !profile?.isAdmin) throw new Error('Not authorized')
      await avatarDb.blockAvatar(avatarId, user.uid, user.email, reason)
      await loadAllAvatars()
      await loadPublicAvatars()
    },
    [user, profile?.isAdmin, loadAllAvatars, loadPublicAvatars]
  )

  const unblockAvatar = useCallback(
    async (avatarId: string) => {
      if (!user?.email || !profile?.isAdmin) throw new Error('Not authorized')
      await avatarDb.unblockAvatar(avatarId, user.uid, user.email)
      await loadAllAvatars()
      await loadUnblockRequests()
      await loadPublicAvatars()
    },
    [user, profile?.isAdmin, loadAllAvatars, loadUnblockRequests, loadPublicAvatars]
  )

  const requestUnblock = useCallback(
    async (avatarId: string, reason: string) => {
      if (!user?.email) throw new Error('Not authenticated')
      await avatarDb.requestUnblock(avatarId, user.uid, user.email, reason)
      await loadUserAvatars()
    },
    [user, loadUserAvatars]
  )

  // ============================================
  // Suggestion functions
  // ============================================

  const submitSuggestion = useCallback(
    async (avatarId: string, suggestedChanges: SuggestedChanges, reason?: string) => {
      if (!user?.email) throw new Error('Not authenticated')
      const suggestion = await avatarDb.submitSuggestion(
        avatarId,
        user.uid,
        user.email,
        suggestedChanges,
        reason
      )
      return suggestion
    },
    [user]
  )

  const approveSuggestion = useCallback(
    async (suggestionId: string, avatarId: string) => {
      if (!user?.email || !profile?.isAdmin) throw new Error('Not authorized')
      await avatarDb.approveSuggestion(suggestionId, avatarId, user.uid, user.email)
      await loadPendingSuggestions()
      await loadAllAvatars()
      await loadPublicAvatars()
    },
    [user, profile?.isAdmin, loadPendingSuggestions, loadAllAvatars, loadPublicAvatars]
  )

  const rejectSuggestion = useCallback(
    async (suggestionId: string, avatarId: string, reason: string) => {
      if (!user?.email || !profile?.isAdmin) throw new Error('Not authorized')
      await avatarDb.rejectSuggestion(suggestionId, avatarId, user.uid, user.email, reason)
      await loadPendingSuggestions()
    },
    [user, profile?.isAdmin, loadPendingSuggestions]
  )

  // ============================================
  // Fork function
  // ============================================

  const forkAvatar = useCallback(
    async (avatarId: string) => {
      if (!user?.email) throw new Error('Not authenticated')
      const forkedAvatar = await avatarDb.forkAvatar(avatarId, user.uid, user.email)
      await loadUserAvatars()
      return forkedAvatar
    },
    [user, loadUserAvatars]
  )

  return {
    // State
    userAvatars,
    publicAvatars,
    allAvatars,
    pendingPromotions,
    pendingSuggestions,
    unblockRequests,
    selectedAvatar,
    selectedAvatarChangelog,
    selectedAvatarSuggestions,
    loading,

    // Computed
    visibleAvatars: getVisibleAvatars(),

    // Load functions
    loadUserAvatars,
    loadPublicAvatars,
    loadAllAvatars,
    loadPendingPromotions,
    loadPendingSuggestions,
    loadUnblockRequests,
    loadAvatarDetails,
    loadAdminData,

    // CRUD
    createAvatar,
    updateAvatar,
    deleteAvatar,

    // Promotion
    requestPromotion,
    approvePromotion,
    rejectPromotion,

    // Blocking
    blockAvatar,
    unblockAvatar,
    requestUnblock,

    // Suggestions
    submitSuggestion,
    approveSuggestion,
    rejectSuggestion,

    // Fork
    forkAvatar,

    // Clear selection
    clearSelection: () => {
      const store = useAvatarStore.getState()
      store.setSelectedAvatar(null)
      store.setSelectedAvatarChangelog([])
      store.setSelectedAvatarSuggestions([])
    },
  }
}
