import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useAvatars } from '../../hooks/useAvatars'
import { AvatarStatusBadge } from './AvatarStatusBadge'
import { ChangelogView } from './ChangelogView'
import { AvatarForm } from './AvatarForm'
import { PromotionWarningModal } from './PromotionWarningModal'
import { SuggestionForm } from './SuggestionForm'
import { ForkConfirmModal } from './ForkConfirmModal'
import { BlockAvatarModal } from '../../modules/admin/components/BlockAvatarModal'

interface AvatarDetailModalProps {
  avatarId: string
  onClose: () => void
}

type Tab = 'details' | 'changelog' | 'suggestions'

export function AvatarDetailModal({ avatarId, onClose }: AvatarDetailModalProps) {
  const { user, profile } = useAuth()
  const {
    selectedAvatar: avatar,
    selectedAvatarChangelog: changelog,
    selectedAvatarSuggestions: suggestions,
    loadAvatarDetails,
    deleteAvatar,
    requestPromotion,
    requestUnblock,
    blockAvatar,
    unblockAvatar,
    clearSelection,
  } = useAvatars()

  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [showEditForm, setShowEditForm] = useState(false)
  const [showPromotionWarning, setShowPromotionWarning] = useState(false)
  const [showSuggestionForm, setShowSuggestionForm] = useState(false)
  const [showForkConfirm, setShowForkConfirm] = useState(false)
  const [showUnblockForm, setShowUnblockForm] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [unblockReason, setUnblockReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const loadAvatarDetailsRef = useRef(loadAvatarDetails)
  const clearSelectionRef = useRef(clearSelection)

  // Keep refs updated
  useEffect(() => {
    loadAvatarDetailsRef.current = loadAvatarDetails
    clearSelectionRef.current = clearSelection
  }, [loadAvatarDetails, clearSelection])

  useEffect(() => {
    if (!avatarId) {
      // Clear selection when modal closes
      clearSelectionRef.current()
      return
    }
    
    let cancelled = false
    const load = async () => {
      try {
        setIsLoading(true)
        setLoadError(null)
        await loadAvatarDetailsRef.current(avatarId)
        if (!cancelled) {
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load avatar details:', err)
          setLoadError(err instanceof Error ? err.message : 'Failed to load avatar')
          setIsLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarId])

  const handleClose = () => {
    setIsLoading(false)
    onClose()
  }

  const isOwner = avatar?.authorUid === user?.uid
  const isAdmin = profile?.isAdmin === true
  // Owner can edit private avatars, admin can edit any avatar
  const canEdit = (isOwner && avatar?.visibility === 'private' && avatar?.status === 'active') ||
                  (isAdmin && avatar?.status === 'active')
  const canDelete = isOwner && avatar?.visibility === 'private'
  const canPromote =
    isOwner &&
    avatar?.visibility === 'private' &&
    avatar?.status === 'active' &&
    avatar?.promotionStatus !== 'pending'
  // Suggestions available for logged-in users (including owner) for public avatars
  const canSuggestChanges = !!user && avatar?.visibility === 'public' && avatar?.status === 'active'
  const canFork = avatar?.visibility === 'public' && avatar?.status === 'active'
  const canRequestUnblock =
    isOwner && avatar?.status === 'blocked' && !avatar?.unblockRequested
  // Admin can block/unblock any avatar
  const canBlock = isAdmin && avatar?.status === 'active'
  const canUnblock = isAdmin && avatar?.status === 'blocked'

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this avatar? This cannot be undone.')) return
    setActionLoading(true)
    setError(null)
    try {
      await deleteAvatar(avatarId)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete avatar')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestUnblock = async () => {
    if (!unblockReason.trim()) return
    setActionLoading(true)
    setError(null)
    try {
      await requestUnblock(avatarId, unblockReason)
      setShowUnblockForm(false)
      setUnblockReason('')
      await loadAvatarDetails(avatarId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request unblock')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnblock = async () => {
    if (!confirm('Are you sure you want to unblock this avatar?')) return
    setActionLoading(true)
    setError(null)
    try {
      await unblockAvatar(avatarId)
      await loadAvatarDetails(avatarId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unblock avatar')
    } finally {
      setActionLoading(false)
    }
  }

  if (loadError) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 max-w-md">
          <p className="text-red-400 mb-4">{loadError}</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg"
          >
            Close
          </button>
        </div>
      </div>,
      document.body
    )
  }

  if (isLoading || !avatar) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>,
      document.body
    )
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex-shrink-0"
                  style={{ backgroundColor: avatar.color }}
                />
                <div>
                  <h2 className="text-xl font-semibold text-white">{avatar.name}</h2>
                  <p className="text-sm text-slate-400">{avatar.model}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AvatarStatusBadge avatar={avatar} />
                <button
                  onClick={handleClose}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-800">
            <nav className="flex px-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('changelog')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'changelog'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Changelog ({changelog.length})
              </button>
              {avatar.visibility === 'public' && (
                <button
                  onClick={() => setActiveTab('suggestions')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'suggestions'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Suggestions ({suggestions.length})
                </button>
              )}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'details' && (
              <div className="space-y-4">
                {/* Blocked warning */}
                {avatar.status === 'blocked' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 font-medium">This avatar is blocked</p>
                    {avatar.blockedReason && (
                      <p className="text-sm text-red-300 mt-1">Reason: {avatar.blockedReason}</p>
                    )}
                    {avatar.blockedBy && (
                      <p className="text-xs text-red-300/70 mt-1">Blocked by: {avatar.blockedBy}</p>
                    )}
                    {avatar.unblockRequested && (
                      <p className="text-xs text-yellow-400 mt-2">Unblock request pending...</p>
                    )}
                  </div>
                )}

                {/* Rejected promotion */}
                {avatar.promotionStatus === 'rejected' && (
                  <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <p className="text-orange-400 font-medium">Promotion request was rejected</p>
                    {avatar.promotionRejectedReason && (
                      <p className="text-sm text-orange-300 mt-1">Reason: {avatar.promotionRejectedReason}</p>
                    )}
                    {avatar.promotionRejectedBy && (
                      <p className="text-xs text-orange-300/70 mt-1">Rejected by: {avatar.promotionRejectedBy}</p>
                    )}
                  </div>
                )}

                {/* Approved promotion */}
                {avatar.visibility === 'public' && avatar.promotionApprovedBy && (
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 font-medium">Public Avatar</p>
                    <p className="text-xs text-green-300/70 mt-1">
                      Approved by {avatar.promotionApprovedBy} on{' '}
                      {avatar.promotionApprovedAt instanceof Date ? avatar.promotionApprovedAt.toLocaleDateString() : ''}
                    </p>
                  </div>
                )}

                {/* Suggestion info for public avatars */}
                {canSuggestChanges && (
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-purple-400 font-medium">Have suggestions for this avatar?</p>
                        <p className="text-xs text-purple-300/70 mt-1">
                          Propose changes to improve this public avatar. Your suggestions will be reviewed by admins.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowSuggestionForm(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                      >
                        Suggest Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* Persona */}
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Persona</h3>
                  <p className="text-slate-400 text-sm whitespace-pre-wrap bg-slate-800/50 p-4 rounded-lg">
                    {avatar.persona}
                  </p>
                </div>

                {/* Tags */}
                {avatar.tags && avatar.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {avatar.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Author:</span>
                    <span className="text-slate-300 ml-2">{avatar.authorEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Created:</span>
                    <span className="text-slate-300 ml-2">{avatar.createdAt instanceof Date ? avatar.createdAt.toLocaleDateString() : ''}</span>
                  </div>
                  {avatar.forkedFromName && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Forked from:</span>
                      <span className="text-slate-300 ml-2">{avatar.forkedFromName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'changelog' && <ChangelogView changelog={changelog} />}

            {activeTab === 'suggestions' && (
              <div className="space-y-4">
                {canSuggestChanges && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowSuggestionForm(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      + Suggest Changes
                    </button>
                  </div>
                )}
                <div className="space-y-3">
                  {suggestions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-400 mb-2">No suggestions yet.</p>
                      {canSuggestChanges && (
                        <p className="text-slate-500 text-sm">Be the first to suggest improvements!</p>
                      )}
                    </div>
                  ) : (
                    suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-400">{suggestion.submitterEmail}</span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              suggestion.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : suggestion.status === 'approved'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {suggestion.status}
                          </span>
                        </div>
                        <div className="text-sm text-slate-300">
                          {Object.entries(suggestion.suggestedChanges).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-slate-500">{key}:</span> {value}
                            </div>
                          ))}
                        </div>
                        {suggestion.submissionReason && (
                          <p className="text-xs text-slate-500 mt-2">Reason: {suggestion.submissionReason}</p>
                        )}
                        {suggestion.rejectionReason && (
                          <p className="text-xs text-red-400 mt-2">Rejected: {suggestion.rejectionReason}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-6 py-3 bg-red-500/20 border-t border-red-500/30">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Unblock request form */}
          {showUnblockForm && (
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/50">
              <h4 className="text-sm font-medium text-white mb-2">Request Unblock</h4>
              <textarea
                value={unblockReason}
                onChange={(e) => setUnblockReason(e.target.value)}
                placeholder="Explain why this avatar should be unblocked..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm placeholder-slate-500 resize-none"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setShowUnblockForm(false)}
                  className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestUnblock}
                  disabled={!unblockReason.trim() || actionLoading}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-50"
                >
                  Submit Request
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-6 border-t border-slate-800 flex flex-wrap gap-2">
            {isAdmin ? (
              <>
                {/* Admin actions: only Edit and Block/Unblock */}
                {canEdit && (
                  <button
                    onClick={() => setShowEditForm(true)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                )}
                {canBlock && (
                  <button
                    onClick={() => setShowBlockModal(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Block
                  </button>
                )}
                {canUnblock && (
                  <button
                    onClick={handleUnblock}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Unblocking...' : 'Unblock'}
                  </button>
                )}
              </>
            ) : (
              <>
                {/* Regular user actions */}
                {canEdit && (
                  <button
                    onClick={() => setShowEditForm(true)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                )}
                {canPromote && (
                  <button
                    onClick={() => setShowPromotionWarning(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Promote to Public
                  </button>
                )}
                {canSuggestChanges && (
                  <button
                    onClick={() => setShowSuggestionForm(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Suggest Changes
                  </button>
                )}
                {canFork && (
                  <button
                    onClick={() => setShowForkConfirm(true)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Fork to Private
                  </button>
                )}
                {canRequestUnblock && !showUnblockForm && (
                  <button
                    onClick={() => setShowUnblockForm(true)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Request Unblock
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Sub-modals */}
      {showEditForm && (
        <AvatarForm
          avatar={avatar}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false)
            loadAvatarDetails(avatarId)
          }}
        />
      )}
      {showPromotionWarning && (
        <PromotionWarningModal
          avatarId={avatarId}
          onClose={() => setShowPromotionWarning(false)}
          onSuccess={() => {
            setShowPromotionWarning(false)
            loadAvatarDetails(avatarId)
          }}
        />
      )}
      {showSuggestionForm && (
        <SuggestionForm
          avatar={avatar}
          onClose={() => setShowSuggestionForm(false)}
          onSuccess={() => {
            setShowSuggestionForm(false)
            loadAvatarDetails(avatarId)
          }}
        />
      )}
      {showForkConfirm && (
        <ForkConfirmModal
          avatar={avatar}
          onClose={() => setShowForkConfirm(false)}
          onSuccess={onClose}
        />
      )}
      {showBlockModal && avatar && (
        <BlockAvatarModal
          avatar={avatar}
          onClose={() => setShowBlockModal(false)}
          onSuccess={() => {
            setShowBlockModal(false)
            loadAvatarDetails(avatarId)
          }}
        />
      )}
    </AnimatePresence>,
    document.body
  )
}
