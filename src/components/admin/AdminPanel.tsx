import { useState } from 'react'
import { UserList } from './UserList'
import { AdminDebateList } from './AdminDebateList'
import { useAuth } from '../../hooks/useAuth'

type Tab = 'users' | 'debates'

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const { logout, profile } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <p className="text-sm text-slate-400">Manage users and debates</p>
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
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('debates')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'debates'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              All Debates
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'users' && <UserList />}
        {activeTab === 'debates' && <AdminDebateList />}
      </main>
    </div>
  )
}
