import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from './firebase'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string
  createdAt: Date
  isAdmin: boolean
  isApproved: boolean
  isBlocked: boolean
  creditsAvailable: number
  creditsUsed: number
}

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid)

  try {
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      const newProfile = {
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        isAdmin: false,
        isApproved: false,
        isBlocked: false,
        creditsAvailable: 0,
        creditsUsed: 0,
      }
      await setDoc(userRef, newProfile)
      return {
        uid: user.uid,
        email: newProfile.email,
        displayName: newProfile.displayName,
        photoURL: newProfile.photoURL,
        createdAt: new Date(),
        isAdmin: false,
        isApproved: false,
        isBlocked: false,
        creditsAvailable: 0,
        creditsUsed: 0,
      }
    }

    const data = userSnap.data()
    return {
      uid: user.uid,
      email: data.email || '',
      displayName: data.displayName || '',
      photoURL: data.photoURL || '',
      createdAt: data.createdAt?.toDate() || new Date(),
      isAdmin: data.isAdmin || false,
      isApproved: data.isApproved || false,
      isBlocked: data.isBlocked || false,
      creditsAvailable: data.creditsAvailable || 0,
      creditsUsed: data.creditsUsed || 0,
    }
  } catch (error) {
    console.error('[Auth] Error in ensureUserProfile:', error)
    throw error
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    return null
  }

  const data = userSnap.data()
  return {
    uid,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    createdAt: data.createdAt?.toDate() || new Date(),
    isAdmin: data.isAdmin || false,
    isApproved: data.isApproved || false,
    isBlocked: data.isBlocked || false,
    creditsAvailable: data.creditsAvailable || 0,
    creditsUsed: data.creditsUsed || 0,
  }
}
