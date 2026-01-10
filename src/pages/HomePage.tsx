import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Scene } from '../components/canvas/Scene'
import { ChatPanel } from '../components/chat/ChatPanel'
import { Header } from '../components/ui/Header'
import { TopicInput } from '../components/ui/TopicInput'
import { ControlButtons } from '../components/ui/ControlButtons'
import { RoundsInput } from '../components/ui/RoundsInput'
import { LanguageSelect } from '../components/ui/LanguageSelect'
import { useAuth } from '../hooks/useAuth'
import { useDebate } from '../hooks/useDebate'

export function HomePage() {
  const { profile, logout, user } = useAuth()
  const { loadAndRestoreDebate } = useDebate()

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
    </div>
  )
}
