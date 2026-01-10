import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Scene } from '../components/canvas/Scene'
import { ChatPanel } from '../components/chat/ChatPanel'
import { Header } from '../components/ui/Header'
import { TopicInput } from '../components/ui/TopicInput'
import { ControlButtons } from '../components/ui/ControlButtons'
import { RoundsInput } from '../components/ui/RoundsInput'
import { LanguageSelect } from '../components/ui/LanguageSelect'
import { DebatersModal } from '../components/ui/DebatersModal'
import { useAuth } from '../hooks/useAuth'
import { useDebate } from '../hooks/useDebate'
import { useDebateStore } from '../stores/debateStore'

export function HomePage() {
  const { profile, logout, user } = useAuth()
  const { loadAndRestoreDebate } = useDebate()
  const { status, selectedAgentIds } = useDebateStore()
  const [showDebatersModal, setShowDebatersModal] = useState(false)

  // Load active debate on mount
  useEffect(() => {
    if (user) {
      loadAndRestoreDebate()
    }
  }, [user, loadAndRestoreDebate])

  return (
    <div className="flex w-full h-full bg-slate-950">
      {/* Left side - 3D Scene with controls */}
      <div className="relative w-1/2 h-full">
        <Scene />

        {/* Header - only on left side */}
        <Header />

        {/* User info bar */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-3 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-800 px-3 py-1.5 flex items-center gap-2">
            <span className="text-slate-400 text-sm">{profile?.creditsAvailable || 0} credits</span>
          </div>
          <Link
            to="/avatars"
            className="bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-800 px-3 py-1.5 text-slate-400 hover:text-white text-sm transition-colors cursor-pointer"
          >
            Avatars
          </Link>
          <Link
            to="/history"
            className="bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-800 px-3 py-1.5 text-slate-400 hover:text-white text-sm transition-colors cursor-pointer"
          >
            History
          </Link>
          {profile?.isAdmin && (
            <Link
              to="/admin"
              className="bg-purple-600/90 backdrop-blur-sm rounded-lg border border-purple-500 px-3 py-1.5 text-white text-sm transition-colors hover:bg-purple-500 cursor-pointer"
            >
              Admin
            </Link>
          )}
          <button
            onClick={logout}
            className="bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-800 px-3 py-1.5 text-slate-400 hover:text-white text-sm transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>

        {/* Control Panel - Bottom left */}
        <div className="absolute left-4 bottom-4 right-4 z-10">
          <div className="bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-800 p-4 space-y-4 shadow-xl">
            {/* Debaters button */}
            {status === 'idle' && (
              <button
                onClick={() => setShowDebatersModal(true)}
                className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-300 hover:text-white text-sm transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Debaters {selectedAgentIds.length > 0 && `(${selectedAgentIds.length})`}
              </button>
            )}
            <TopicInput />
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <ControlButtons />
                <RoundsInput />
              </div>
              <LanguageSelect />
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Chat Panel */}
      <div className="w-1/2 h-full border-l border-slate-800">
        <ChatPanel />
      </div>

      {/* Debaters Modal */}
      <DebatersModal
        isOpen={showDebatersModal}
        onClose={() => setShowDebatersModal(false)}
      />
    </div>
  )
}
