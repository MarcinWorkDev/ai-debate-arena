import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Avatar } from '../../lib/types/avatar'
import { useAvatars } from '../../hooks/useAvatars'

interface ForkConfirmModalProps {
  avatar: Avatar
  onClose: () => void
  onSuccess: () => void
}

export function ForkConfirmModal({ avatar, onClose, onSuccess }: ForkConfirmModalProps) {
  const { forkAvatar } = useAvatars()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      await forkAvatar(avatar.id)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fork avatar')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: avatar.color }}
            />
            <div>
              <h2 className="text-xl font-semibold text-white">Fork Avatar</h2>
              <p className="text-sm text-slate-400">{avatar.name}</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-slate-300">
              This will create a <span className="text-cyan-400 font-medium">private copy</span> of
              this avatar that you can freely modify.
            </p>
            <p className="text-slate-400 text-sm">
              The new avatar will be named "{avatar.name} (Fork)" and will be linked to the original
              for reference.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Fork'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
