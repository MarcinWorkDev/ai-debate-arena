import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { useAvatars } from '../../../hooks/useAvatars'
import { usePageScroll } from '../../../shared/hooks/usePageScroll'
import { PageLayout } from '../../../shared/layout/PageLayout'
import { PageHeader } from '../../../shared/layout/PageHeader'
import { TabNavigation, type Tab } from '../../../shared/layout/TabNavigation'
import { AdminUserList } from '../components/AdminUserList'
import { AdminDebateList } from '../components/AdminDebateList'
import { AdminAvatarList } from '../components/AdminAvatarList'
import { AdminChangeRequests } from '../components/AdminChangeRequests'

type TabId = 'users' | 'debates' | 'avatars' | 'change-requests'

export function AdminDashboard() {
  const { logout, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    pendingPromotions,
    pendingSuggestions,
    unblockRequests,
    loadAdminData,
  } = useAvatars()

  const tabFromUrl = searchParams.get('tab') as TabId | null
  const validTabs: TabId[] = ['users', 'debates', 'avatars', 'change-requests']
  const initialTab = (tabFromUrl && validTabs.includes(tabFromUrl)) ? tabFromUrl : 'users'
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
      // If no tab in URL, default to users and add it
      setSearchParams({ tab: 'users' }, { replace: true })
      setActiveTab('users')
    }
  }, [searchParams, setSearchParams])

  usePageScroll()

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])

  const tabs: Tab[] = [
    { id: 'users', label: 'Users' },
    { id: 'debates', label: 'All Debates' },
    { id: 'avatars', label: 'All Avatars' },
    {
      id: 'change-requests',
      label: 'Change Requests',
      count: pendingPromotions.length + pendingSuggestions.length + unblockRequests.length,
      badgeColor: 'yellow',
    },
  ]

  return (
    <PageLayout
      header={
        <PageHeader>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              <p className="text-sm text-slate-400">Manage users, debates, and avatars</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm">{profile?.email}</span>
              <Link
                to="/user"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
              >
                My Account
              </Link>
              <Link
                to="/"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
              >
                Debate Arena
              </Link>
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
        basePath="/admin"
      />

      <div className="mt-6">
        {activeTab === 'users' && <AdminUserList />}
        {activeTab === 'debates' && <AdminDebateList />}
        {activeTab === 'avatars' && <AdminAvatarList />}
        {activeTab === 'change-requests' && <AdminChangeRequests />}
      </div>
    </PageLayout>
  )
}

