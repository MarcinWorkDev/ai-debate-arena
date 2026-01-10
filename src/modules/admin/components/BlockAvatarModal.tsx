import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Avatar } from '../../../lib/types/avatar'
import { useAvatars } from '../../../hooks/useAvatars'

interface BlockAvatarModalProps {
  avatar: Avatar
  onClose: () => void
  onSuccess: () => void
}

export function BlockAvatarModal({ avatar, onClose, onSuccess }: BlockAvatarModalProps) {
  const { blockAvatar } = useAvatars()
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return

    setLoading(true)
    setError(null)

    try {
      await blockAvatar(avatar.id, reason)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to block avatar')
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
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
              className="w-10 h-10 rounded-full"
              style={{ backgroundColor: avatar.color }}
            />
            <div>
              <h2 className="text-xl font-semibold text-white">Block Avatar</h2>
              <p className="text-sm text-slate-400">{avatar.name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Reason for blocking
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this avatar is being blocked..."
                rows={4}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 outline-none focus:border-red-500 resize-none"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                The author will see this reason.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !reason.trim()}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Blocking...' : 'Block Avatar'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
