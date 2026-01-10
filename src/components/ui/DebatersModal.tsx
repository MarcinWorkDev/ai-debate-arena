import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useDebateStore } from '../../stores/debateStore'
import { useAvatars } from '../../hooks/useAvatars'
import type { Avatar } from '../../lib/types/avatar'

interface DebatersModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DebatersModal({ isOpen, onClose }: DebatersModalProps) {
  const { selectedAgentIds, toggleAgentSelection } = useDebateStore()
  const { userAvatars, publicAvatars, loading, loadUserAvatars, loadPublicAvatars } = useAvatars()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Load avatars when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUserAvatars()
      loadPublicAvatars()
    }
  }, [isOpen, loadUserAvatars, loadPublicAvatars])

  if (!mounted) return null

  // Combine user avatars and public avatars (deduplicated)
  const allAvatars: Avatar[] = [...userAvatars]
  for (const publicAvatar of publicAvatars) {
    if (!allAvatars.find((a) => a.id === publicAvatar.id)) {
      allAvatars.push(publicAvatar)
    }
  }

  // Filter to only active avatars (not blocked)
  const availableAvatars = allAvatars.filter((a) => a.status === 'active')

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-2xl max-h-[80vh] bg-slate-900 rounded-xl border border-slate-800 shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Select Debaters</h2>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-slate-400">
                  Select 2-10 debaters. Selected: {selectedAgentIds.length} / 10
                  {selectedAgentIds.length < 2 && (
                    <span className="text-amber-400 ml-2">(Minimum 2 required)</span>
                  )}
                </p>
                <Link
                  to="/avatars"
                  onClick={onClose}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Manage Avatars
                </Link>
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : availableAvatars.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 mb-4">No avatars available.</p>
                  <Link
                    to="/avatars"
                    onClick={onClose}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Create your first avatar
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableAvatars.map((avatar) => {
                    const isSelected = selectedAgentIds.includes(avatar.id)
                    const isDisabled = !isSelected && selectedAgentIds.length >= 10
                    const cannotDeselect = isSelected && selectedAgentIds.length <= 2

                    return (
                      <motion.label
                        key={avatar.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`
                          flex items-center gap-4 p-4 rounded-lg border cursor-pointer
                          transition-all duration-200
                          ${isSelected
                            ? 'bg-blue-500/20 border-blue-500/50'
                            : isDisabled
                            ? 'bg-slate-800/50 border-slate-700/50 opacity-50 cursor-not-allowed'
                            : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 hover:border-slate-600'
                          }
                          ${cannotDeselect ? 'ring-2 ring-amber-500/30' : ''}
                        `}
                      >
                        {/* Checkbox with slide animation */}
                        <div className="relative flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => !isDisabled && !cannotDeselect && toggleAgentSelection(avatar.id)}
                            disabled={isDisabled || cannotDeselect}
                            className="sr-only"
                          />
                          <motion.div
                            className={`
                              w-6 h-6 rounded border-2 flex items-center justify-center
                              ${isSelected
                                ? 'bg-blue-500 border-blue-500'
                                : 'bg-transparent border-slate-600'
                              }
                            `}
                            animate={{
                              scale: isSelected ? 1 : 0.9,
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            <motion.svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              initial={false}
                              animate={{
                                opacity: isSelected ? 1 : 0,
                                scale: isSelected ? 1 : 0,
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </motion.svg>
                          </motion.div>
                        </div>

                        {/* Avatar info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: avatar.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{avatar.name}</span>
                              {avatar.visibility === 'public' && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded">
                                  Public
                                </span>
                              )}
                              {userAvatars.some(ua => ua.id === avatar.id) && avatar.visibility === 'private' && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-slate-500/20 text-slate-400 rounded">
                                  Mine
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mb-1">{avatar.model}</div>
                            <div className="text-xs text-slate-500 leading-relaxed line-clamp-2">{avatar.persona}</div>
                          </div>
                        </div>
                      </motion.label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-800">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Done ({selectedAgentIds.length} selected)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
