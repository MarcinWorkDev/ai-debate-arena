import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Avatar, CreateAvatarInput, UpdateAvatarInput } from '../../lib/types/avatar'
import { useAvatars } from '../../hooks/useAvatars'

interface AvatarFormProps {
  avatar?: Avatar
  onClose: () => void
  onSuccess: () => void
}

const AVAILABLE_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#f97316', // orange
  '#a855f7', // purple
  '#6366f1', // indigo
  '#ef4444', // red
  '#ec4899', // pink
  '#14b8a6', // teal
  '#84cc16', // lime
]

const AVAILABLE_MODELS = ['gpt-4o', 'gpt-4o-mini']

export function AvatarForm({ avatar, onClose, onSuccess }: AvatarFormProps) {
  const { createAvatar, updateAvatar } = useAvatars()
  const isEditing = !!avatar

  const [name, setName] = useState(avatar?.name || '')
  const [color, setColor] = useState(avatar?.color || AVAILABLE_COLORS[0])
  const [model, setModel] = useState(avatar?.model || AVAILABLE_MODELS[0])
  const [persona, setPersona] = useState(avatar?.persona || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isEditing) {
        const updates: UpdateAvatarInput = {}
        if (name !== avatar.name) updates.name = name
        if (color !== avatar.color) updates.color = color
        if (model !== avatar.model) updates.model = model
        if (persona !== avatar.persona) updates.persona = persona
        await updateAvatar(avatar.id, updates)
      } else {
        const data: CreateAvatarInput = { name, color, model, persona }
        await createAvatar(data)
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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
          className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              {isEditing ? 'Edit Avatar' : 'Create New Avatar'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Senior Developer"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                  required
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Persona */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Persona (System Prompt)
                </label>
                <textarea
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  placeholder="Describe this avatar's personality, expertise, and how they should respond in debates..."
                  rows={6}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all resize-none"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Tip: End with "Answer concisely, maximum 2-3 sentences." for better debate flow.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Avatar'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
