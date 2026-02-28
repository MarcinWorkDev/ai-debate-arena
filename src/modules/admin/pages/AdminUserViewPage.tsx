import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUserProfile, type UserProfile } from '../../../lib/auth'
import { getUserDebates, type Debate } from '../../../lib/db'
import { getUserAuditLog, type UserAuditLogEntry, approveUser, blockUser, unblockUser, assignCredits, setUserCredits } from '../../../lib/db'
import { getUserAvatars } from '../../../lib/avatarDb'
import type { Avatar } from '../../../lib/types/avatar'
import { useAuth } from '../../../hooks/useAuth'
import { usePageScroll } from '../../../shared/hooks/usePageScroll'
import { PageLayout } from '../../../shared/layout/PageLayout'
import { PageHeader } from '../../../shared/layout/PageHeader'
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { ShareToggle } from '../../../components/debates/ShareToggle'
import { AvatarCard } from '../../../shared/avatars/AvatarCard'
import { AvatarDetailModal } from '../../../shared/avatars/AvatarDetailModal'

export function AdminUserViewPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user: currentUser, profile: currentProfile } = useAuth()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [debates, setDebates] = useState<Debate[]>([])
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [auditLog, setAuditLog] = useState<UserAuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creditsInput, setCreditsInput] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)

  usePageScroll()

  const loadData = async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    try {
      const [userData, debatesData, avatarsData, auditLogData] = await Promise.all([
        getUserProfile(userId),
        getUserDebates(userId),
        getUserAvatars(userId),
        getUserAuditLog(userId),
      ])

      if (!userData) {
        setError('User not found')
        return
      }

      setUser(userData)
      setDebates(debatesData)
      setAvatars(avatarsData)
      setAuditLog(auditLogData)
    } catch (err) {
      console.error('Error loading user:', err)
      setError('Failed to load user')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [userId])

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/admin?tab=users')
    }
  }

  const handleApprove = async () => {
    if (!userId || !currentUser?.uid || !currentProfile?.email) return
    setActionLoading(true)
    try {
      await approveUser(userId, currentUser.uid, currentProfile.email)
      await loadData()
    } catch (err) {
      console.error('Error approving user:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBlock = async () => {
    if (!userId || !currentUser?.uid || !currentProfile?.email || !blockReason.trim()) return
    setActionLoading(true)
    try {
      await blockUser(userId, currentUser.uid, currentProfile.email, blockReason)
      setShowBlockModal(false)
      setBlockReason('')
      await loadData()
    } catch (err) {
      console.error('Error blocking user:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnblock = async () => {
    if (!userId || !currentUser?.uid || !currentProfile?.email) return
    setActionLoading(true)
    try {
      await unblockUser(userId, currentUser.uid, currentProfile.email)
      await loadData()
    } catch (err) {
      console.error('Error unblocking user:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddCredits = async () => {
    if (!userId || !currentUser?.uid || !currentProfile?.email) return
    const amount = parseInt(creditsInput, 10)
    if (amount > 0) {
      setActionLoading(true)
      try {
        await assignCredits(userId, amount, currentUser.uid, currentProfile.email)
        setCreditsInput('')
        await loadData()
      } catch (err) {
        console.error('Error adding credits:', err)
      } finally {
        setActionLoading(false)
      }
    }
  }

  const handleSetCredits = async () => {
    if (!userId || !currentUser?.uid || !currentProfile?.email) return
    const amount = parseInt(creditsInput, 10)
    if (amount >= 0) {
      setActionLoading(true)
      try {
        await setUserCredits(userId, amount, currentUser.uid, currentProfile.email)
        setCreditsInput('')
        await loadData()
      } catch (err) {
        console.error('Error setting credits:', err)
      } finally {
        setActionLoading(false)
      }
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      </PageLayout>
    )
  }

  if (error || !user) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <EmptyState
            icon={
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            title="Not Found"
            message={error || 'User not found'}
            action={
              <button
                onClick={handleBack}
                className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Back
              </button>
            }
          />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      header={
        <PageHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">User Details</h1>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
            </div>
            <Link
              to="/admin?tab=users"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
            >
              Back to Users
            </Link>
          </div>
        </PageHeader>
      }
    >
      <div className="space-y-6">
        {/* User Info Card */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || user.email}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-400 text-2xl font-medium">
                  {user.displayName?.[0] || user.email?.[0] || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-white">{user.displayName || 'No name'}</h2>
                {user.isAdmin && (
                  <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-full">
                    Admin
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-400">Email:</span>{' '}
                  <span className="text-white">{user.email}</span>
                </div>
                <div>
                  <span className="text-slate-400">User ID:</span>{' '}
                  <span className="text-slate-300 font-mono text-xs">{user.uid}</span>
                </div>
                <div>
                  <span className="text-slate-400">Created:</span>{' '}
                  <span className="text-white">{user.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <StatusBadge
                status={user.isBlocked ? 'blocked' : user.isApproved ? 'approved' : 'pending'}
                type="user"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
            <div>
              <div className="text-slate-400 text-sm">Credits Available</div>
              <div className="text-white text-xl font-semibold">{user.creditsAvailable}</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm">Credits Used</div>
              <div className="text-white text-xl font-semibold">{user.creditsUsed}</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm">Total Debates</div>
              <div className="text-white text-xl font-semibold">{debates.length}</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm">Total Avatars</div>
              <div className="text-white text-xl font-semibold">{avatars.length}</div>
            </div>
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
          <div className="space-y-4">
            {/* Status Actions */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Account Status</label>
              <div className="flex items-center gap-3">
                <StatusBadge
                  status={user.isBlocked ? 'blocked' : user.isApproved ? 'approved' : 'pending'}
                  type="user"
                />
                <div className="flex gap-2">
                  {!user.isApproved && !user.isBlocked && (
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {user.isBlocked ? (
                    <button
                      onClick={handleUnblock}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowBlockModal(true)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Block
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Credits Management */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Credits Management</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={creditsInput}
                  onChange={(e) => setCreditsInput(e.target.value)}
                  placeholder="Amount"
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm w-32"
                />
                <button
                  onClick={handleAddCredits}
                  disabled={actionLoading || !creditsInput || parseInt(creditsInput, 10) <= 0}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  Add Credits
                </button>
                <button
                  onClick={handleSetCredits}
                  disabled={actionLoading || creditsInput === '' || parseInt(creditsInput, 10) < 0}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  Set Credits
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Current: {user.creditsAvailable} available, {user.creditsUsed} used
              </p>
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Audit Log</h3>
          {auditLog.length === 0 ? (
            <EmptyState message="No audit log entries yet." />
          ) : (
            <div className="space-y-3">
              {auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-slate-800/50 rounded-lg border border-slate-700 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          entry.action === 'approved' || entry.action === 'unblocked' || entry.action === 'credits_added'
                            ? 'bg-green-500/20 text-green-400'
                            : entry.action === 'blocked'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {entry.action.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 text-sm">{entry.actorEmail}</span>
                        <span className="text-slate-500 text-xs">
                          {entry.timestamp.toLocaleString()}
                        </span>
                      </div>
                      {entry.details && (
                        <div className="text-sm text-slate-300 mt-2 space-y-1">
                          {entry.details.oldValue !== undefined && entry.details.newValue !== undefined && (
                            <div>
                              <span className="text-slate-500">Credits:</span>{' '}
                              <span className="text-red-400">{entry.details.oldValue}</span>
                              {' → '}
                              <span className="text-green-400">{entry.details.newValue}</span>
                            </div>
                          )}
                          {entry.details.reason && (
                            <div>
                              <span className="text-slate-500">Reason:</span>{' '}
                              <span className="text-slate-300">{entry.details.reason}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avatars List */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Avatars</h3>
          {avatars.length === 0 ? (
            <EmptyState message="This user has no avatars yet." />
          ) : (
            <div className="space-y-6">
              {/* Public Avatars */}
              {avatars.filter(a => a.visibility === 'public').length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-slate-300 mb-3">
                    Public Avatars ({avatars.filter(a => a.visibility === 'public').length})
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {avatars
                      .filter(a => a.visibility === 'public')
                      .map((avatar) => (
                        <AvatarCard
                          key={avatar.id}
                          avatar={avatar}
                          showOwner={false}
                          onClick={() => setSelectedAvatarId(avatar.id)}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Private Avatars */}
              {avatars.filter(a => a.visibility === 'private').length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-slate-300 mb-3">
                    Private Avatars ({avatars.filter(a => a.visibility === 'private').length})
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {avatars
                      .filter(a => a.visibility === 'private')
                      .map((avatar) => (
                        <AvatarCard
                          key={avatar.id}
                          avatar={avatar}
                          showOwner={false}
                          onClick={() => setSelectedAvatarId(avatar.id)}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Debates List */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">User Debates</h3>
          {debates.length === 0 ? (
            <EmptyState message="This user has no debates yet." />
          ) : (
            <div className="space-y-4">
              {debates.map((debate) => (
                <div
                  key={debate.id}
                  className="bg-slate-900 rounded-xl border border-slate-800 p-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      to={`/debate/${debate.id}?from=admin`}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <h4 className="text-white font-medium truncate hover:text-blue-400 transition-colors">
                        {debate.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                        <StatusBadge status={debate.status} type="debate" />
                        <span>{debate.creditsUsed} credits</span>
                        <span>{debate.roundCount} / {debate.maxRounds} rounds</span>
                        <span>{debate.createdAt.toLocaleDateString()}</span>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <ShareToggle
                        debateId={debate.id}
                        isPublic={debate.isPublic}
                        publicSlug={debate.publicSlug}
                        onUpdate={async () => {
                          const debatesData = await getUserDebates(userId!)
                          setDebates(debatesData)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Avatar Detail Modal */}
      {selectedAvatarId && (
        <AvatarDetailModal
          avatarId={selectedAvatarId}
          onClose={() => setSelectedAvatarId(null)}
        />
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Block User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason for blocking
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Explain why this user is being blocked..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 outline-none focus:border-red-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBlockModal(false)
                    setBlockReason('')
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlock}
                  disabled={actionLoading || !blockReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Blocking...' : 'Block User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

export default AdminUserViewPage
