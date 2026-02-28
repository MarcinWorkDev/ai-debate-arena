import { useEffect, useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'

const Scene = lazy(() => import('../../../components/canvas/Scene'))
import { ChatPanel } from '../../../components/chat/ChatPanel'
import { Header } from '../../../components/ui/Header'
import { TopicInput } from '../../../components/ui/TopicInput'
import { ControlButtons } from '../../../components/ui/ControlButtons'
import { RoundsInput } from '../../../components/ui/RoundsInput'
import { LanguageSelect } from '../../../components/ui/LanguageSelect'
import { DebatersModal } from '../../../components/ui/DebatersModal'
import { useAuth } from '../../../hooks/useAuth'
import { useDebate } from '../../../hooks/useDebate'
import { useAvatars } from '../../../hooks/useAvatars'
import { useDebateStore } from '../../../stores/debateStore'

export function DebatePage() {
  const { profile, user } = useAuth()
  const { loadAndRestoreDebate } = useDebate()
  const { loadUserAvatars, loadPublicAvatars } = useAvatars()
  const { status, selectedAgentIds, userName, setUserName } = useDebateStore()
  const [showDebatersModal, setShowDebatersModal] = useState(false)

  // Load avatars on mount
  useEffect(() => {
    if (user) {
      loadUserAvatars()
      loadPublicAvatars()
    }
  }, [user, loadUserAvatars, loadPublicAvatars])

  // Set default user name from profile if not set
  useEffect(() => {
    if (profile?.displayName && (!userName || userName.trim() === '' || userName === 'You')) {
      setUserName(profile.displayName)
    }
  }, [profile?.displayName, userName, setUserName])

  // Load active debate on mount
  useEffect(() => {
    if (user) {
      loadAndRestoreDebate()
    }
  }, [user, loadAndRestoreDebate])

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-slate-950">
      {/* Left/Top side - 3D Scene with controls */}
      <div className="relative h-[30vh] md:h-full w-full md:w-2/5 lg:w-1/2 shrink-0">
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
            <div className="text-slate-400">Loading 3D scene...</div>
          </div>
        }>
          <Scene />
        </Suspense>

        {/* Header - only on scene side */}
        <Header />

        {/* User menu */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-50 pointer-events-auto">
          <Link
            to="/user"
            className="bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-800 px-2 py-1.5 md:px-3 md:py-2 flex items-center gap-2 hover:bg-slate-800 transition-colors group"
          >
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-400 text-sm font-medium">
                  {profile?.displayName?.[0] || profile?.email?.[0] || 'U'}
                </span>
              )}
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-white text-sm font-medium">
                {profile?.displayName || 'User'}
              </span>
              <span className="text-slate-400 text-xs">
                {profile?.creditsAvailable || 0} credits
              </span>
            </div>
            <svg
              className="hidden md:block w-4 h-4 text-slate-400 group-hover:text-white transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Control Panel - Bottom of scene (hidden on mobile, shown below scene instead) */}
        <div className="hidden md:block absolute left-4 bottom-4 right-4 z-10">
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

      {/* Mobile Control Panel - between scene and chat */}
      <div className="md:hidden shrink-0 border-y border-slate-800">
        <div className="bg-slate-900/95 backdrop-blur-sm p-2 space-y-2">
          {status === 'idle' && (
            <button
              onClick={() => setShowDebatersModal(true)}
              className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 hover:text-white text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Debaters {selectedAgentIds.length > 0 && `(${selectedAgentIds.length})`}
            </button>
          )}
          <TopicInput />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ControlButtons />
              <RoundsInput />
            </div>
            <LanguageSelect />
          </div>
        </div>
      </div>

      {/* Right/Bottom side - Chat Panel */}
      <div className="flex-1 min-h-0 w-full md:border-l border-slate-800">
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

