import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { usePageScroll } from '../../../shared/hooks/usePageScroll'
import { PageLayout } from '../../../shared/layout/PageLayout'
import { PageHeader } from '../../../shared/layout/PageHeader'
import { TabNavigation, type Tab } from '../../../shared/layout/TabNavigation'
import { UserDebateList } from '../components/UserDebateList'
import { UserAvatarList } from '../components/UserAvatarList'
import { PublicAvatarList } from '../components/PublicAvatarList'
import { useAvatars } from '../../../hooks/useAvatars'
import { getUserAuditLog, type UserAuditLogEntry } from '../../../lib/db'
import { EmptyState } from '../../../shared/ui/EmptyState'

type TabId = 'debates' | 'avatars' | 'public-avatars' | 'settings'

export function UserPage() {
  const { user, profile, logout } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    userAvatars,
    publicAvatars,
    loading: avatarsLoading,
    loadUserAvatars,
    loadPublicAvatars,
  } = useAvatars()
  const [creditsHistory, setCreditsHistory] = useState<UserAuditLogEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const tabFromUrl = searchParams.get('tab') as TabId | null
  const validTabs: TabId[] = ['debates', 'avatars', 'public-avatars', 'settings']
  const initialTab = (tabFromUrl && validTabs.includes(tabFromUrl)) ? tabFromUrl : 'debates'
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)

  // Sync URL with tab changes - always include query param
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true })
  }, [activeTab, setSearchParams])

  // Sync tab with URL changes on mount and URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabId | null
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      if (tabFromUrl !== activeTab) {
        setActiveTab(tabFromUrl)
      }
    } else if (!tabFromUrl) {
      // If no tab in URL, default to debates and add it
      setSearchParams({ tab: 'debates' }, { replace: true })
      setActiveTab('debates')
    }
  }, [searchParams, setSearchParams])

  usePageScroll()

  useEffect(() => {
    if (activeTab === 'avatars' || activeTab === 'public-avatars') {
      loadUserAvatars()
      loadPublicAvatars()
    }
  }, [activeTab, loadUserAvatars, loadPublicAvatars])

  useEffect(() => {
    const loadCreditsHistory = async () => {
      if (activeTab === 'settings' && user?.uid) {
        setLoadingHistory(true)
        try {
          const auditLog = await getUserAuditLog(user.uid)
          // Filter only credits-related entries
          const creditsEntries = auditLog.filter(
            entry => entry.action === 'credits_added' || entry.action === 'credits_set'
          )
          setCreditsHistory(creditsEntries)
        } catch (err) {
          console.error('Error loading credits history:', err)
        } finally {
          setLoadingHistory(false)
        }
      }
    }
    loadCreditsHistory()
  }, [activeTab, user?.uid])

  const tabs: Tab[] = [
    { id: 'debates', label: 'My Debates' },
    { id: 'avatars', label: 'My Avatars', count: userAvatars.length },
    { id: 'public-avatars', label: 'Public Avatars', count: publicAvatars.length },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <PageLayout
      header={
        <PageHeader>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">My Account</h1>
              <p className="text-sm text-slate-400">{profile?.displayName || profile?.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-white text-sm">{profile?.creditsAvailable || 0} credits</div>
                <div className="text-slate-400 text-xs">available</div>
              </div>
              <Link
                to="/"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
              >
                Debate Arena
              </Link>
              {profile?.isAdmin && (
                <Link
                  to="/admin"
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={logout}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </PageHeader>
      }
    >
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabId)}
        basePath="/user"
      />

      <div className="mt-6">
        {activeTab === 'debates' && <UserDebateList />}
        {activeTab === 'avatars' && (
          <UserAvatarList
            avatars={userAvatars}
            loading={avatarsLoading}
            onRefresh={loadUserAvatars}
          />
        )}
        {activeTab === 'public-avatars' && (
          <PublicAvatarList
            avatars={publicAvatars}
            loading={avatarsLoading}
          />
        )}
        {activeTab === 'settings' && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profile?.displayName || ''}
                  disabled
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Display name is managed by your Google account
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Credits
                </label>
                <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg">
                  <div className="text-white font-medium">{profile?.creditsAvailable || 0} available</div>
                  <div className="text-slate-400 text-sm">{profile?.creditsUsed || 0} used</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Account Status
                </label>
                <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    {profile?.isApproved ? (
                      <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                        Approved
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                        Pending Approval
                      </span>
                    )}
                    {profile?.isAdmin && (
                      <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Credits History */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <h3 className="text-md font-semibold text-white mb-4">Credits History</h3>
              {loadingHistory ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : creditsHistory.length === 0 ? (
                <EmptyState message="No credits history yet." />
              ) : (
                <div className="space-y-3">
                  {creditsHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-slate-800/50 rounded-lg border border-slate-700 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              entry.action === 'credits_added'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {entry.action === 'credits_added' ? 'Credits Added' : 'Credits Set'}
                            </span>
                            <span className="text-slate-400 text-sm">{entry.actorEmail}</span>
                            <span className="text-slate-500 text-xs">
                              {entry.timestamp.toLocaleString()}
                            </span>
                          </div>
                          {entry.details && entry.details.oldValue !== undefined && entry.details.newValue !== undefined && (
                            <div className="text-sm text-slate-300 mt-2">
                              <span className="text-slate-500">Credits:</span>{' '}
                              <span className="text-red-400">{entry.details.oldValue}</span>
                              {' → '}
                              <span className="text-green-400">{entry.details.newValue}</span>
                              {entry.action === 'credits_added' && (
                                <span className="text-slate-500 ml-2">
                                  (+{Number(entry.details.newValue) - Number(entry.details.oldValue)})
                                </span>
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
          </div>
        )}
      </div>
    </PageLayout>
  )
}

