import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'

interface NoCreditsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NoCreditsModal({ isOpen, onClose }: NoCreditsModalProps) {
  const { profile, refreshProfile, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

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
            className="relative w-full max-w-md bg-slate-900 rounded-xl border border-slate-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
              <div className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <h2 className="text-xl font-bold text-white mb-2 text-center">No Credits Available</h2>
                <p className="text-slate-400 mb-2 text-center">
                  You don't have enough credits to start a new debate.
                </p>
                <p className="text-slate-500 text-sm mb-6 text-center">
                  Credits used: {profile?.creditsUsed || 0} | Available: {profile?.creditsAvailable || 0}
                </p>

                <div className="space-y-3">
                  <button
                    onClick={refreshProfile}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Checking...' : 'Check for New Credits'}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full px-4 py-2 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}

