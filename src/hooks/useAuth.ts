import { useEffect, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import {
  signInWithGoogle,
  signOut,
  onAuthChange,
  ensureUserProfile,
} from '../lib/auth'

export function useAuth() {
  const { user, profile, loading, error } = useAuthStore()

  useEffect(() => {
    let mounted = true

    // Timeout - if no auth state in 5s, stop loading
    const timeout = setTimeout(() => {
      if (mounted) {
        const store = useAuthStore.getState()
        if (store.loading) {
          store.setLoading(false)
        }
      }
    }, 5000)

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!mounted) return
      clearTimeout(timeout)

      const store = useAuthStore.getState()

      if (firebaseUser) {
        store.setUser(firebaseUser)
        try {
          const userProfile = await ensureUserProfile(firebaseUser)
          if (mounted) {
            store.setProfile(userProfile)
            store.setError(null)
          }
        } catch (err) {
          console.error('[useAuth] Error fetching user profile:', err)
          if (mounted) {
            store.setError('Failed to load user profile')
          }
        }
      } else {
        store.setUser(null)
        store.setProfile(null)
      }

      if (mounted) {
        store.setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeout)
      unsubscribe()
    }
  }, [])

  const login = useCallback(async () => {
    const store = useAuthStore.getState()
    store.setLoading(true)
    store.setError(null)
    try {
      await signInWithGoogle()
      // Page will redirect to Google, no need to handle response here
    } catch (err) {
      console.error('Login error:', err)
      store.setError('Failed to sign in')
      store.setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    const store = useAuthStore.getState()
    try {
      await signOut()
      store.reset()
    } catch (err) {
      console.error('Logout error:', err)
      store.setError('Failed to sign out')
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const store = useAuthStore.getState()
    const currentUser = store.user
    if (!currentUser) return
    try {
      const userProfile = await ensureUserProfile(currentUser)
      store.setProfile(userProfile)
    } catch (err) {
      console.error('Error refreshing profile:', err)
    }
  }, [])

  return {
    user,
    profile,
    loading,
    error,
    login,
    logout,
    refreshProfile,
    isAuthenticated: !!user,
    isApproved: profile?.isApproved ?? false,
    isBlocked: profile?.isBlocked ?? false,
    isAdmin: profile?.isAdmin ?? false,
    canUseApp: !!user && profile?.isApproved && !profile?.isBlocked,
    hasCredits: (profile?.creditsAvailable ?? 0) > 0,
  }
}
