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
  tokensUsed: number // Total tokens (for backwards compatibility)
  inputTokens: number // Prompt/input tokens
  outputTokens: number // Completion/output tokens
  reasoningTokens: number // Reasoning tokens (if applicable)
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
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data()
    // Ensure all token fields are properly extracted (handle both undefined and 0 values)
    const tokensUsed = typeof data.tokensUsed === 'number' ? data.tokensUsed : 0
    const inputTokens = typeof data.inputTokens === 'number' ? data.inputTokens : (tokensUsed || 0)
    const outputTokens = typeof data.outputTokens === 'number' ? data.outputTokens : 0
    const reasoningTokens = typeof data.reasoningTokens === 'number' ? data.reasoningTokens : 0
    
    return {
      id: docSnap.id,
      ...data,
      tokensUsed,
      inputTokens,
      outputTokens,
      reasoningTokens,
    } as DebateMessage
  })
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

// ============================================
// User Audit Log
// ============================================

export interface UserAuditLogEntry {
  id: string
  action: 'approved' | 'blocked' | 'unblocked' | 'credits_added' | 'credits_set' | 'created'
  actorUid: string
  actorEmail: string
  details?: {
    oldValue?: number | boolean
    newValue?: number | boolean
    reason?: string
  }
  timestamp: Date
}

async function addUserAuditLogEntry(
  userId: string,
  action: UserAuditLogEntry['action'],
  actorUid: string,
  actorEmail: string,
  details?: UserAuditLogEntry['details']
): Promise<void> {
  const auditLogRef = collection(db, 'users', userId, 'auditLog')
  await addDoc(auditLogRef, {
    action,
    actorUid,
    actorEmail,
    details: details || null,
    timestamp: serverTimestamp(),
  })
}

export async function getUserAuditLog(userId: string): Promise<UserAuditLogEntry[]> {
  const auditLogRef = collection(db, 'users', userId, 'auditLog')
  const q = query(auditLogRef, orderBy('timestamp', 'desc'))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      action: data.action,
      actorUid: data.actorUid,
      actorEmail: data.actorEmail,
      details: data.details || undefined,
      timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(),
    }
  })
}

// ============================================
// Admin Functions
// ============================================

export async function approveUser(userId: string, adminUid: string, adminEmail: string): Promise<void> {
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  const wasApproved = userSnap.data()?.isApproved || false
  
  await updateDoc(userRef, { isApproved: true })
  
  if (!wasApproved) {
    await addUserAuditLogEntry(userId, 'approved', adminUid, adminEmail)
  }
}

export async function blockUser(userId: string, adminUid: string, adminEmail: string, reason?: string): Promise<void> {
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  const wasBlocked = userSnap.data()?.isBlocked || false
  
  await updateDoc(userRef, { isBlocked: true })
  
  if (!wasBlocked) {
    await addUserAuditLogEntry(userId, 'blocked', adminUid, adminEmail, { reason })
  }
}

export async function unblockUser(userId: string, adminUid: string, adminEmail: string): Promise<void> {
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  const wasBlocked = userSnap.data()?.isBlocked || false
  
  await updateDoc(userRef, { isBlocked: false })
  
  if (wasBlocked) {
    await addUserAuditLogEntry(userId, 'unblocked', adminUid, adminEmail)
  }
}

export async function assignCredits(userId: string, credits: number, adminUid: string, adminEmail: string): Promise<void> {
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  const oldCredits = userSnap.data()?.creditsAvailable || 0
  const newCredits = oldCredits + credits
  
  await updateDoc(userRef, {
    creditsAvailable: increment(credits),
  })
  
  await addUserAuditLogEntry(userId, 'credits_added', adminUid, adminEmail, {
    oldValue: oldCredits,
    newValue: newCredits,
  })
}

export async function setUserCredits(
  userId: string,
  creditsAvailable: number,
  adminUid: string,
  adminEmail: string
): Promise<void> {
  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  const oldCredits = userSnap.data()?.creditsAvailable || 0
  
  await updateDoc(userRef, { creditsAvailable })
  
  if (oldCredits !== creditsAvailable) {
    await addUserAuditLogEntry(userId, 'credits_set', adminUid, adminEmail, {
      oldValue: oldCredits,
      newValue: creditsAvailable,
    })
  }
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
