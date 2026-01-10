import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAvatars } from '../hooks/useAvatars'
import { AvatarList } from '../components/avatars/AvatarList'
import { AvatarForm } from '../components/avatars/AvatarForm'
import { AvatarDetailModal } from '../components/avatars/AvatarDetailModal'

type Tab = 'my-avatars' | 'public-avatars'

export function AvatarsPage() {
  const { profile } = useAuth()
  const {
    userAvatars,
    publicAvatars,
    loading,
    loadUserAvatars,
    loadPublicAvatars,
  } = useAvatars()

  const [activeTab, setActiveTab] = useState<Tab>('my-avatars')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)

  useEffect(() => {
    loadUserAvatars()
    loadPublicAvatars()
  }, [loadUserAvatars, loadPublicAvatars])

  // Enable scrolling on avatars page
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

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors">
              &larr; Back to Debate
            </Link>
            <h1 className="text-xl font-semibold text-white">Avatars</h1>
          </div>
          <div className="flex items-center gap-3">
            {profile?.isAdmin && (
              <Link
                to="/admin"
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Create Avatar
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('my-avatars')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'my-avatars'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              My Avatars ({userAvatars.length})
            </button>
            <button
              onClick={() => setActiveTab('public-avatars')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'public-avatars'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Public Avatars ({publicAvatars.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'my-avatars' && (
              <AvatarList
                avatars={userAvatars}
                showOwner={false}
                emptyMessage="You haven't created any avatars yet. Click 'Create Avatar' to get started!"
                selectedAvatarId={selectedAvatarId}
                onAvatarSelect={setSelectedAvatarId}
              />
            )}
            {activeTab === 'public-avatars' && (
              <AvatarList
                avatars={publicAvatars}
                showOwner={true}
                emptyMessage="No public avatars available yet."
                selectedAvatarId={selectedAvatarId}
                onAvatarSelect={setSelectedAvatarId}
              />
            )}
          </>
        )}
      </main>

      {/* Create Form Modal */}
      {showCreateForm && (
        <AvatarForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            loadUserAvatars()
          }}
        />
      )}

      {/* Avatar Detail Modal */}
      {selectedAvatarId && (
        <AvatarDetailModal
          avatarId={selectedAvatarId}
          onClose={() => setSelectedAvatarId(null)}
        />
      )}
    </div>
  )
}
