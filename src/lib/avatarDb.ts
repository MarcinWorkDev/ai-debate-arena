import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  Avatar,
  AvatarChangelog,
  AvatarSuggestion,
  CreateAvatarInput,
  UpdateAvatarInput,
  ChangelogAction,
  ChangelogEntry,
  SuggestedChanges,
  AvatarSuggestionWithAvatarName,
} from './types/avatar'

// ============================================
// Helper: Convert Firestore document to Avatar
// ============================================
function docToAvatar(docSnap: { id: string; data: () => Record<string, unknown> }): Avatar {
  const data = docSnap.data()
  return {
    id: docSnap.id,
    name: data.name as string,
    color: data.color as string,
    model: data.model as string,
    persona: data.persona as string,
    tags: data.tags as string[] | undefined,
    authorEmail: data.authorEmail as string,
    authorUid: data.authorUid as string,
    visibility: data.visibility as Avatar['visibility'],
    status: data.status as Avatar['status'],
    blockedReason: data.blockedReason as string | undefined,
    blockedAt: data.blockedAt ? (data.blockedAt as Timestamp).toDate() : undefined,
    blockedBy: data.blockedBy as string | undefined,
    unblockRequested: data.unblockRequested as boolean | undefined,
    unblockRequestedAt: data.unblockRequestedAt ? (data.unblockRequestedAt as Timestamp).toDate() : undefined,
    unblockRequestReason: data.unblockRequestReason as string | undefined,
    promotionStatus: data.promotionStatus as Avatar['promotionStatus'],
    promotionRequestedAt: data.promotionRequestedAt ? (data.promotionRequestedAt as Timestamp).toDate() : undefined,
    promotionApprovedAt: data.promotionApprovedAt ? (data.promotionApprovedAt as Timestamp).toDate() : undefined,
    promotionApprovedBy: data.promotionApprovedBy as string | undefined,
    promotionRejectedAt: data.promotionRejectedAt ? (data.promotionRejectedAt as Timestamp).toDate() : undefined,
    promotionRejectedBy: data.promotionRejectedBy as string | undefined,
    promotionRejectedReason: data.promotionRejectedReason as string | undefined,
    forkedFromId: data.forkedFromId as string | undefined,
    forkedFromName: data.forkedFromName as string | undefined,
    isMigrated: data.isMigrated as boolean | undefined,
    originalAgentId: data.originalAgentId as string | undefined,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  }
}

// ============================================
// Changelog (internal helper)
// ============================================
async function addChangelogEntry(
  avatarId: string,
  action: ChangelogAction,
  actorUid: string,
  actorEmail: string,
  details?: {
    changes?: ChangelogEntry[]
    reason?: string
    suggestionId?: string
  }
): Promise<void> {
  const changelogRef = collection(db, 'avatars', avatarId, 'changelog')
  await addDoc(changelogRef, {
    avatarId,
    action,
    actorUid,
    actorEmail,
    changes: details?.changes || null,
    reason: details?.reason || null,
    suggestionId: details?.suggestionId || null,
    timestamp: serverTimestamp(),
  })
}

// ============================================
// Avatar CRUD Operations
// ============================================

export async function createAvatar(
  authorUid: string,
  authorEmail: string,
  data: CreateAvatarInput
): Promise<Avatar> {
  const avatarData = {
    name: data.name,
    color: data.color,
    model: data.model,
    persona: data.persona,
    tags: data.tags || [],
    authorEmail,
    authorUid,
    visibility: 'private' as const,
    status: 'active' as const,
    promotionStatus: 'none' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, 'avatars'), avatarData)

  // Add changelog entry
  await addChangelogEntry(docRef.id, 'created', authorUid, authorEmail)

  return {
    id: docRef.id,
    ...data,
    tags: data.tags || [],
    authorEmail,
    authorUid,
    visibility: 'private',
    status: 'active',
    promotionStatus: 'none',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export async function getAvatar(avatarId: string): Promise<Avatar | null> {
  const docRef = doc(db, 'avatars', avatarId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToAvatar(docSnap)
}

export async function getUserVisibleAvatars(userUid: string): Promise<Avatar[]> {
  // Get user's own avatars
  const userAvatarsQuery = query(
    collection(db, 'avatars'),
    where('authorUid', '==', userUid),
    orderBy('createdAt', 'desc')
  )
  const userSnapshot = await getDocs(userAvatarsQuery)
  const userAvatars = userSnapshot.docs.map(docToAvatar)

  // Get all public active avatars
  const publicAvatarsQuery = query(
    collection(db, 'avatars'),
    where('visibility', '==', 'public'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  )
  const publicSnapshot = await getDocs(publicAvatarsQuery)
  const publicAvatars = publicSnapshot.docs.map(docToAvatar)

  // Merge and deduplicate (user might own some public avatars)
  const allAvatars = [...userAvatars]
  for (const publicAvatar of publicAvatars) {
    if (!allAvatars.find((a) => a.id === publicAvatar.id)) {
      allAvatars.push(publicAvatar)
    }
  }

  return allAvatars
}

export async function getUserAvatars(userUid: string): Promise<Avatar[]> {
  const q = query(
    collection(db, 'avatars'),
    where('authorUid', '==', userUid),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(docToAvatar)
}

export async function getPublicAvatars(): Promise<Avatar[]> {
  const q = query(
    collection(db, 'avatars'),
    where('visibility', '==', 'public'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(docToAvatar)
}

export async function updateAvatar(
  avatarId: string,
  updates: UpdateAvatarInput,
  actorUid: string,
  actorEmail: string
): Promise<void> {
  const avatar = await getAvatar(avatarId)
  if (!avatar) {
    throw new Error('Avatar not found')
  }

  // Build changelog changes
  const changes: ChangelogEntry[] = []
  if (updates.name !== undefined && updates.name !== avatar.name) {
    changes.push({ field: 'name', oldValue: avatar.name, newValue: updates.name })
  }
  if (updates.color !== undefined && updates.color !== avatar.color) {
    changes.push({ field: 'color', oldValue: avatar.color, newValue: updates.color })
  }
  if (updates.model !== undefined && updates.model !== avatar.model) {
    changes.push({ field: 'model', oldValue: avatar.model, newValue: updates.model })
  }
  if (updates.persona !== undefined && updates.persona !== avatar.persona) {
    changes.push({ field: 'persona', oldValue: avatar.persona, newValue: updates.persona })
  }
  if (updates.tags !== undefined) {
    const oldTags = (avatar.tags || []).join(', ')
    const newTags = (updates.tags || []).join(', ')
    if (oldTags !== newTags) {
      changes.push({ field: 'tags', oldValue: oldTags || '', newValue: newTags || '' })
    }
  }

  if (changes.length === 0) {
    return // No changes
  }

  const docRef = doc(db, 'avatars', avatarId)
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })

  await addChangelogEntry(avatarId, 'updated', actorUid, actorEmail, { changes })
}

export async function deleteAvatar(avatarId: string, actorUid: string): Promise<void> {
  const avatar = await getAvatar(avatarId)
  if (!avatar) {
    throw new Error('Avatar not found')
  }

  if (avatar.authorUid !== actorUid) {
    throw new Error('Only the author can delete this avatar')
  }

  if (avatar.visibility === 'public') {
    throw new Error('Cannot delete public avatars')
  }

  await deleteDoc(doc(db, 'avatars', avatarId))
}

// ============================================
// Promotion Workflow
// ============================================

export async function requestPromotion(
  avatarId: string,
  actorUid: string,
  actorEmail: string
): Promise<void> {
  const avatar = await getAvatar(avatarId)
  if (!avatar) {
    throw new Error('Avatar not found')
  }

  if (avatar.authorUid !== actorUid) {
    throw new Error('Only the author can request promotion')
  }

  if (avatar.visibility === 'public') {
    throw new Error('Avatar is already public')
  }

  if (avatar.promotionStatus === 'pending') {
    throw new Error('Promotion request already pending')
  }

  const docRef = doc(db, 'avatars', avatarId)
  await updateDoc(docRef, {
    promotionStatus: 'pending',
    promotionRequestedAt: serverTimestamp(),
    promotionRejectedAt: null,
    promotionRejectedBy: null,
    promotionRejectedReason: null,
    updatedAt: serverTimestamp(),
  })

  await addChangelogEntry(avatarId, 'promoted_request', actorUid, actorEmail)
}

export async function approvePromotion(
  avatarId: string,
  adminUid: string,
  adminEmail: string
): Promise<void> {
  const avatar = await getAvatar(avatarId)
  if (!avatar) {
    throw new Error('Avatar not found')
  }

  if (avatar.promotionStatus !== 'pending') {
    throw new Error('No pending promotion request')
  }

  const docRef = doc(db, 'avatars', avatarId)
  await updateDoc(docRef, {
    visibility: 'public',
    promotionStatus: 'approved',
    promotionApprovedAt: serverTimestamp(),
    promotionApprovedBy: adminEmail,
    updatedAt: serverTimestamp(),
  })

  await addChangelogEntry(avatarId, 'promoted_approved', adminUid, adminEmail)
}

export async function rejectPromotion(
  avatarId: string,
  adminUid: string,
  adminEmail: string,
  reason: string
): Promise<void> {
  const avatar = await getAvatar(avatarId)
  if (!avatar) {
    throw new Error('Avatar not found')
  }

  if (avatar.promotionStatus !== 'pending') {
    throw new Error('No pending promotion request')
  }

  const docRef = doc(db, 'avatars', avatarId)
  await updateDoc(docRef, {
    promotionStatus: 'rejected',
    promotionRejectedAt: serverTimestamp(),
    promotionRejectedBy: adminEmail,
    promotionRejectedReason: reason,
    updatedAt: serverTimestamp(),
  })

  await addChangelogEntry(avatarId, 'promoted_rejected', adminUid, adminEmail, { reason })
}

// ============================================
// Blocking System
// ============================================

export async function blockAvatar(
  avatarId: string,
  adminUid: string,
  adminEmail: string,
  reason: string
): Promise<void> {
  const avatar = await getAvatar(avatarId)
  if (!avatar) {
    throw new Error('Avatar not found')
  }

  const docRef = doc(db, 'avatars', avatarId)
  await updateDoc(docRef, {
    status: 'blocked',
    blockedAt: serverTimestamp(),
    blockedBy: adminEmail,
    blockedReason: reason,
    unblockRequested: false,
    unblockRequestedAt: null,
    unblockRequestReason: null,
    updatedAt: serverTimestamp(),
  })

  await addChangelogEntry(avatarId, 'blocked', adminUid, adminEmail, { reason })
}

export async function unblockAvatar(
  avatarId: string,
  adminUid: string,
  adminEmail: string
): Promise<void> {
  const avatar = await getAvatar(avatarId)
  if (!avatar) {
    throw new Error('Avatar not found')
  }

  if (avatar.status !== 'blocked') {
    throw new Error('Avatar is not blocked')
  }

  const docRef = doc(db, 'avatars', avatarId)
  await updateDoc(docRef, {
    status: 'active',
    blockedAt: null,
    blockedBy: null,
    blockedReason: null,
    unblockRequested: false,
    unblockRequestedAt: null,
    unblockRequestReason: null,
    updatedAt: serverTimestamp(),
  })

  await addChangelogEntry(avatarId, 'unblocked', adminUid, adminEmail)
}

export async function requestUnblock(
  avatarId: string,
  authorUid: string,
  authorEmail: string,
  reason: string
): Promise<void> {
  const avatar = await getAvatar(avatarId)
  if (!avatar) {
    throw new Error('Avatar not found')
  }

  if (avatar.authorUid !== authorUid) {
    throw new Error('Only the author can request unblock')
  }

  if (avatar.status !== 'blocked') {
    throw new Error('Avatar is not blocked')
  }

  const docRef = doc(db, 'avatars', avatarId)
  await updateDoc(docRef, {
    unblockRequested: true,
    unblockRequestedAt: serverTimestamp(),
    unblockRequestReason: reason,
    updatedAt: serverTimestamp(),
  })

  await addChangelogEntry(avatarId, 'unblock_requested', authorUid, authorEmail, { reason })
}

// ============================================
// Suggestions (for public avatars)
// ============================================

export async function submitSuggestion(
  avatarId: string,
  submitterUid: string,
  submitterEmail: string,
  suggestedChanges: SuggestedChanges,
  reason?: string
): Promise<AvatarSuggestion> {
  const avatar = await getAvatar(avatarId)
  if (!avatar) {
    throw new Error('Avatar not found')
  }

  if (avatar.visibility !== 'public') {
    throw new Error('Can only suggest changes to public avatars')
  }

  const suggestionData = {
    avatarId,
    suggestedChanges,
    submitterEmail,
    submitterUid,
    submissionReason: reason || null,
    status: 'pending' as const,
    createdAt: serverTimestamp(),
  }

  const suggestionsRef = collection(db, 'avatars', avatarId, 'suggestions')
  const docRef = await addDoc(suggestionsRef, suggestionData)

  await addChangelogEntry(avatarId, 'suggestion_submitted', submitterUid, submitterEmail, {
    suggestionId: docRef.id,
  })

  return {
    id: docRef.id,
    avatarId,
    suggestedChanges,
    submitterEmail,
    submitterUid,
    submissionReason: reason,
    status: 'pending',
    createdAt: new Date(),
  }
}

export async function getAvatarSuggestions(avatarId: string): Promise<AvatarSuggestion[]> {
  const suggestionsRef = collection(db, 'avatars', avatarId, 'suggestions')
  const q = query(suggestionsRef, orderBy('createdAt', 'desc'))

  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      avatarId: data.avatarId,
      suggestedChanges: data.suggestedChanges,
      submitterEmail: data.submitterEmail,
      submitterUid: data.submitterUid,
      submissionReason: data.submissionReason || undefined,
      status: data.status,
      reviewedAt: data.reviewedAt ? (data.reviewedAt as Timestamp).toDate() : undefined,
      reviewedBy: data.reviewedBy || undefined,
      rejectionReason: data.rejectionReason || undefined,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    }
  })
}

export async function getAllPendingSuggestions(): Promise<AvatarSuggestionWithAvatarName[]> {
  // Get all public avatars first
  const avatarsQuery = query(
    collection(db, 'avatars'),
    where('visibility', '==', 'public')
  )
  const avatarsSnapshot = await getDocs(avatarsQuery)
  const avatarMap = new Map<string, string>()
  avatarsSnapshot.docs.forEach((d) => {
    avatarMap.set(d.id, d.data().name as string)
  })

  // For each avatar, get pending suggestions
  const allSuggestions: AvatarSuggestionWithAvatarName[] = []
  for (const avatarDoc of avatarsSnapshot.docs) {
    const suggestionsRef = collection(db, 'avatars', avatarDoc.id, 'suggestions')
    const q = query(suggestionsRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'))
    const suggestionsSnapshot = await getDocs(q)

    for (const suggDoc of suggestionsSnapshot.docs) {
      const data = suggDoc.data()
      allSuggestions.push({
        id: suggDoc.id,
        avatarId: avatarDoc.id,
        avatarName: avatarMap.get(avatarDoc.id) || 'Unknown',
        suggestedChanges: data.suggestedChanges,
        submitterEmail: data.submitterEmail,
        submitterUid: data.submitterUid,
        submissionReason: data.submissionReason || undefined,
        status: data.status,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      })
    }
  }

  return allSuggestions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function approveSuggestion(
  suggestionId: string,
  avatarId: string,
  adminUid: string,
  adminEmail: string
): Promise<void> {
  const suggestionRef = doc(db, 'avatars', avatarId, 'suggestions', suggestionId)
  const suggestionSnap = await getDoc(suggestionRef)

  if (!suggestionSnap.exists()) {
    throw new Error('Suggestion not found')
  }

  const suggestionData = suggestionSnap.data()
  if (suggestionData.status !== 'pending') {
    throw new Error('Suggestion is not pending')
  }

  const suggestedChanges = suggestionData.suggestedChanges as SuggestedChanges

  // Get current avatar for changelog
  const avatar = await getAvatar(avatarId)
  if (!avatar) {
    throw new Error('Avatar not found')
  }

  // Build changes for changelog
  const changes: ChangelogEntry[] = []
  const updates: Record<string, string> = {}

  if (suggestedChanges.name) {
    changes.push({ field: 'name', oldValue: avatar.name, newValue: suggestedChanges.name })
    updates.name = suggestedChanges.name
  }
  if (suggestedChanges.color) {
    changes.push({ field: 'color', oldValue: avatar.color, newValue: suggestedChanges.color })
    updates.color = suggestedChanges.color
  }
  if (suggestedChanges.model) {
    changes.push({ field: 'model', oldValue: avatar.model, newValue: suggestedChanges.model })
    updates.model = suggestedChanges.model
  }
  if (suggestedChanges.persona) {
    changes.push({ field: 'persona', oldValue: avatar.persona, newValue: suggestedChanges.persona })
    updates.persona = suggestedChanges.persona
  }
  if (suggestedChanges.tags) {
    const oldTags = (avatar.tags || []).join(', ')
    const newTags = (suggestedChanges.tags || []).join(', ')
    changes.push({ field: 'tags', oldValue: oldTags || '', newValue: newTags || '' })
    updates.tags = suggestedChanges.tags
  }

  // Update avatar with suggested changes
  const avatarRef = doc(db, 'avatars', avatarId)
  await updateDoc(avatarRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  })

  // Update suggestion status
  await updateDoc(suggestionRef, {
    status: 'approved',
    reviewedAt: serverTimestamp(),
    reviewedBy: adminEmail,
  })

  await addChangelogEntry(avatarId, 'suggestion_approved', adminUid, adminEmail, {
    changes,
    suggestionId,
  })
}

export async function rejectSuggestion(
  suggestionId: string,
  avatarId: string,
  adminUid: string,
  adminEmail: string,
  reason: string
): Promise<void> {
  const suggestionRef = doc(db, 'avatars', avatarId, 'suggestions', suggestionId)
  const suggestionSnap = await getDoc(suggestionRef)

  if (!suggestionSnap.exists()) {
    throw new Error('Suggestion not found')
  }

  if (suggestionSnap.data().status !== 'pending') {
    throw new Error('Suggestion is not pending')
  }

  await updateDoc(suggestionRef, {
    status: 'rejected',
    reviewedAt: serverTimestamp(),
    reviewedBy: adminEmail,
    rejectionReason: reason,
  })

  await addChangelogEntry(avatarId, 'suggestion_rejected', adminUid, adminEmail, {
    reason,
    suggestionId,
  })
}

// ============================================
// Forking
// ============================================

export async function forkAvatar(
  sourceAvatarId: string,
  newOwnerUid: string,
  newOwnerEmail: string
): Promise<Avatar> {
  const sourceAvatar = await getAvatar(sourceAvatarId)
  if (!sourceAvatar) {
    throw new Error('Source avatar not found')
  }

  if (sourceAvatar.visibility !== 'public') {
    throw new Error('Can only fork public avatars')
  }

  const avatarData = {
    name: `${sourceAvatar.name} (Fork)`,
    color: sourceAvatar.color,
    model: sourceAvatar.model,
    persona: sourceAvatar.persona,
    tags: sourceAvatar.tags || [],
    authorEmail: newOwnerEmail,
    authorUid: newOwnerUid,
    visibility: 'private' as const,
    status: 'active' as const,
    promotionStatus: 'none' as const,
    forkedFromId: sourceAvatarId,
    forkedFromName: sourceAvatar.name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, 'avatars'), avatarData)

  await addChangelogEntry(docRef.id, 'forked', newOwnerUid, newOwnerEmail)

  return {
    id: docRef.id,
    name: avatarData.name,
    color: avatarData.color,
    model: avatarData.model,
    persona: avatarData.persona,
    authorEmail: newOwnerEmail,
    authorUid: newOwnerUid,
    visibility: 'private',
    status: 'active',
    promotionStatus: 'none',
    forkedFromId: sourceAvatarId,
    forkedFromName: sourceAvatar.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

// ============================================
// Changelog
// ============================================

export async function getAvatarChangelog(avatarId: string): Promise<AvatarChangelog[]> {
  const changelogRef = collection(db, 'avatars', avatarId, 'changelog')
  const q = query(changelogRef, orderBy('timestamp', 'desc'))

  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      avatarId: data.avatarId,
      action: data.action,
      actorEmail: data.actorEmail,
      actorUid: data.actorUid,
      changes: data.changes || undefined,
      reason: data.reason || undefined,
      suggestionId: data.suggestionId || undefined,
      timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(),
    }
  })
}

// ============================================
// Admin Functions
// ============================================

export async function getAllAvatars(): Promise<Avatar[]> {
  const q = query(collection(db, 'avatars'), orderBy('createdAt', 'desc'))

  const snapshot = await getDocs(q)
  return snapshot.docs.map(docToAvatar)
}

export async function getPendingPromotions(): Promise<Avatar[]> {
  const q = query(
    collection(db, 'avatars'),
    where('promotionStatus', '==', 'pending'),
    orderBy('promotionRequestedAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(docToAvatar)
}

export async function getUnblockRequests(): Promise<Avatar[]> {
  const q = query(
    collection(db, 'avatars'),
    where('status', '==', 'blocked'),
    where('unblockRequested', '==', true),
    orderBy('unblockRequestedAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(docToAvatar)
}

