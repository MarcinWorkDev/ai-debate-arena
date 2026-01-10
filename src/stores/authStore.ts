import { create } from 'zustand'
import type { User } from 'firebase/auth'
import type { UserProfile } from '../lib/auth'

interface AuthState {
  // State
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null

  // Actions
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  profile: null,
  loading: true, // Start with loading until auth state is checked
  error: null,

  // Actions
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({ user: null, profile: null, loading: false, error: null }),
}))
