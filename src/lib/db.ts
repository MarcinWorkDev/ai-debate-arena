import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Agent } from './agents'

// ============================================
// Types
// ============================================

export interface AvatarSnapshot {
  avatarId: string | null // Original avatar ID, null for ad-hoc
  name: string
  color: string
  model: string
  persona: string
  position: [number, number, number]
  rotation: number
  isModerator?: boolean
  isHuman?: boolean
}

export interface Debate {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  status: 'running' | 'paused' | 'finished'
  creditsUsed: number
  isPublic: boolean
  publicSlug: string
  avatarsSnapshot: AvatarSnapshot[]
  language: 'en' | 'pl'
  maxRounds: number
  roundCount: number
}

export interface DebateMessage {
  id: string
  avatarId: string // Avatar ID from snapshot, or 'user'
  avatarName: string
  avatarColor: string
  avatarModel: string
  content: string
  timestamp: number
  tokensUsed: number
  parentMessageId: string | null
}

// ============================================
// Debates
// ============================================

export async function createDebate(
  userId: string,
  title: string,
  agents: Agent[],
  language: 'en' | 'pl' = 'en',
  maxRounds: number = 10
): Promise<Debate> {
  const publicSlug = generateSlug()

  const avatarsSnapshot: AvatarSnapshot[] = agents.map(agent => {
    const snapshot: AvatarSnapshot = {
      avatarId: agent.id,
      name: agent.name,
      color: agent.color,
      model: agent.model,
      persona: agent.persona,
      position: agent.position,
      rotation: agent.rotation,
    }
    
    // Only include optional fields if they are defined (Firestore doesn't accept undefined)
    if (agent.isModerator !== undefined) {
      snapshot.isModerator = agent.isModerator
    }
    if (agent.isHuman !== undefined) {
      snapshot.isHuman = agent.isHuman
    }
    
    return snapshot
  })

  const debateData = {
    userId: userId,
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'running' as const,
    creditsUsed: 0,
    isPublic: false,
    publicSlug,
    avatarsSnapshot,
    language,
    maxRounds,
    roundCount: 0,
  }

  const docRef = await addDoc(collection(db, 'debates'), debateData)

  return {
    id: docRef.id,
    userId: userId,
    title,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'running',
    creditsUsed: 0,
    isPublic: false,
    publicSlug,
    avatarsSnapshot,
    language,
    maxRounds,
    roundCount: 0,
  }
}

export async function getDebate(debateId: string): Promise<Debate | null> {
  const docRef = doc(db, 'debates', debateId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data()
  return {
    id: docSnap.id,
    userId: data.userId,
    title: data.title,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    status: data.status,
    creditsUsed: data.creditsUsed || 0,
    isPublic: data.isPublic || false,
    publicSlug: data.publicSlug,
    avatarsSnapshot: data.avatarsSnapshot || [],
    language: data.language || 'en',
    maxRounds: data.maxRounds || 10,
    roundCount: data.roundCount || 0,
  }
}

export async function getDebateBySlug(slug: string): Promise<Debate | null> {
  const q = query(
    collection(db, 'debates'),
    where('publicSlug', '==', slug),
    where('isPublic', '==', true),
    limit(1)
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) {
    return null
  }

  const docSnap = snapshot.docs[0]
  const data = docSnap.data()
  return {
    id: docSnap.id,
    userId: data.userId,
    title: data.title,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    status: data.status,
    creditsUsed: data.creditsUsed || 0,
    isPublic: data.isPublic,
    publicSlug: data.publicSlug,
    avatarsSnapshot: data.avatarsSnapshot || [],
    language: data.language || 'en',
    maxRounds: data.maxRounds || 10,
    roundCount: data.roundCount || 0,
  }
}

export async function getUserDebates(userId: string): Promise<Debate[]> {
  const q = query(
    collection(db, 'debates'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      userId: data.userId,
      title: data.title,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      status: data.status,
      creditsUsed: data.creditsUsed || 0,
      isPublic: data.isPublic || false,
      publicSlug: data.publicSlug,
      avatarsSnapshot: data.avatarsSnapshot || [],
      language: data.language || 'en',
      maxRounds: data.maxRounds || 10,
      roundCount: data.roundCount || 0,
    }
  })
}

export async function getActiveDebate(userId: string): Promise<Debate | null> {
  // Get the most recent running or paused debate
  const q = query(
    collection(db, 'debates'),
    where('userId', '==', userId),
    where('status', 'in', ['running', 'paused']),
    orderBy('updatedAt', 'desc'),
    limit(1)
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) {
    return null
  }

  const docSnap = snapshot.docs[0]
  const data = docSnap.data()
  return {
    id: docSnap.id,
    userId: data.userId,
    title: data.title,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    status: data.status,
    creditsUsed: data.creditsUsed || 0,
    isPublic: data.isPublic || false,
    publicSlug: data.publicSlug,
    avatarsSnapshot: data.avatarsSnapshot || [],
    language: data.language || 'en',
    maxRounds: data.maxRounds || 10,
    roundCount: data.roundCount || 0,
  }
}

export async function getAllDebates(): Promise<Debate[]> {
  const q = query(
    collection(db, 'debates'),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      userId: data.userId,
      title: data.title,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      status: data.status,
      creditsUsed: data.creditsUsed || 0,
      isPublic: data.isPublic || false,
      publicSlug: data.publicSlug,
      avatarsSnapshot: data.avatarsSnapshot || [],
      language: data.language || 'en',
      maxRounds: data.maxRounds || 10,
      roundCount: data.roundCount || 0,
    }
  })
}

export async function updateDebate(
  debateId: string,
  updates: Partial<Pick<Debate, 'title' | 'status' | 'isPublic' | 'roundCount'>>
): Promise<void> {
  const docRef = doc(db, 'debates', debateId)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export async function addCreditsToDebate(debateId: string, credits: number): Promise<void> {
  const docRef = doc(db, 'debates', debateId)
  await updateDoc(docRef, {
    creditsUsed: increment(credits),
    updatedAt: serverTimestamp(),
  })
}

// ============================================
// Messages
// ============================================

export async function addMessage(
  debateId: string,
  message: Omit<DebateMessage, 'id'>
): Promise<DebateMessage> {
  const messagesRef = collection(db, 'debates', debateId, 'messages')
  const docRef = await addDoc(messagesRef, message)

  // Update debate's updatedAt
  const debateRef = doc(db, 'debates', debateId)
  await updateDoc(debateRef, { updatedAt: serverTimestamp() })

  return { id: docRef.id, ...message }
}

export async function getMessages(debateId: string): Promise<DebateMessage[]> {
  const messagesRef = collection(db, 'debates', debateId, 'messages')
  const q = query(messagesRef, orderBy('timestamp', 'asc'))

  const snapshot = await getDocs(q)
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data() as Omit<DebateMessage, 'id'>,
  }))
}

export async function getReplies(
  debateId: string,
  parentMessageId: string
): Promise<DebateMessage[]> {
  const messagesRef = collection(db, 'debates', debateId, 'messages')
  const q = query(
    messagesRef,
    where('parentMessageId', '==', parentMessageId),
    orderBy('timestamp', 'asc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data() as Omit<DebateMessage, 'id'>,
  }))
}

// ============================================
// User Credits
// ============================================

export async function updateUserCredits(
  userId: string,
  creditsUsed: number
): Promise<void> {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    creditsUsed: increment(creditsUsed),
    creditsAvailable: increment(-creditsUsed),
  })
}

export async function setUserCredits(
  userId: string,
  creditsAvailable: number
): Promise<void> {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, { creditsAvailable })
}

// ============================================
// Admin Functions
// ============================================

export async function getAllUsers() {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(docSnap => ({
    uid: docSnap.id,
    ...docSnap.data(),
    createdAt: (docSnap.data().createdAt as Timestamp)?.toDate() || new Date(),
  }))
}

export async function approveUser(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, { isApproved: true })
}

export async function blockUser(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, { isBlocked: true })
}

export async function unblockUser(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, { isBlocked: false })
}

export async function assignCredits(userId: string, credits: number): Promise<void> {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    creditsAvailable: increment(credits),
  })
}

// ============================================
// Helpers
// ============================================

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let slug = ''
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return slug
}
