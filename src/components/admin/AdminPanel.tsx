import { useState, useEffect } from 'react'
import { UserList } from './UserList'
import { AdminDebateList } from './AdminDebateList'
import { AdminAvatarList } from './AdminAvatarList'
import { PromotionRequestList } from './PromotionRequestList'
import { SuggestionReviewList } from './SuggestionReviewList'
import { UnblockRequestList } from './UnblockRequestList'
import { useAuth } from '../../hooks/useAuth'
import { useAvatars } from '../../hooks/useAvatars'

type Tab = 'users' | 'debates' | 'avatars' | 'promotions' | 'suggestions' | 'unblock'

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const { logout, profile } = useAuth()
  const {
    pendingPromotions,
    pendingSuggestions,
    unblockRequests,
    loadAdminData,
  } = useAvatars()

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])

  // Enable scrolling on admin pages
  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return

    // Add classes
    document.documentElement.classList.add('admin-page')
    document.body.classList.add('admin-page')
    
    // Directly set styles to ensure scrolling works
    document.documentElement.style.overflow = 'auto'
    document.documentElement.style.height = 'auto'
    document.documentElement.style.minHeight = '100%'
    
    document.body.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.body.style.minHeight = '100%'
    
    root.style.overflow = 'auto'
    root.style.height = 'auto'
    root.style.minHeight = '100%'

    return () => {
      document.documentElement.classList.remove('admin-page')
      document.body.classList.remove('admin-page')
      
      // Reset styles
      document.documentElement.style.overflow = ''
      document.documentElement.style.height = ''
      document.documentElement.style.minHeight = ''
      
      document.body.style.overflow = ''
      document.body.style.height = ''
      document.body.style.minHeight = ''
      
      root.style.overflow = ''
      root.style.height = ''
      root.style.minHeight = ''
    }
  }, [])

  const pendingCount = pendingPromotions.length + pendingSuggestions.length + unblockRequests.length

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <p className="text-sm text-slate-400">Manage users, debates, and avatars</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm">{profile?.email}</span>
            <a
              href="/"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
            >
              Back to App
            </a>
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('debates')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'debates'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              All Debates
            </button>
            <button
              onClick={() => setActiveTab('avatars')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'avatars'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              All Avatars
            </button>
            <button
              onClick={() => setActiveTab('promotions')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'promotions'
                  ? 'border-yellow-500 text-yellow-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Promotions
              {pendingPromotions.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                  {pendingPromotions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'suggestions'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Suggestions
              {pendingSuggestions.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">
                  {pendingSuggestions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('unblock')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'unblock'
                  ? 'border-red-500 text-red-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Unblock Requests
              {unblockRequests.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                  {unblockRequests.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'users' && <UserList />}
        {activeTab === 'debates' && <AdminDebateList />}
        {activeTab === 'avatars' && <AdminAvatarList />}
        {activeTab === 'promotions' && <PromotionRequestList />}
        {activeTab === 'suggestions' && <SuggestionReviewList />}
        {activeTab === 'unblock' && <UnblockRequestList />}
      </main>
    </div>
  )
}
