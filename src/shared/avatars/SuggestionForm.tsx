import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Avatar, SuggestedChanges } from '../../lib/types/avatar'
import { useAvatars } from '../../hooks/useAvatars'

interface SuggestionFormProps {
  avatar: Avatar
  onClose: () => void
  onSuccess: () => void
}

const AVAILABLE_MODELS = (import.meta.env.VITE_AVAILABLE_MODELS || 'openai/gpt-4o,google/gemini-2.5-flash,meta-llama/llama-4-maverick')
  .split(',')
  .map((m: string) => m.trim())

export function SuggestionForm({ avatar, onClose, onSuccess }: SuggestionFormProps) {
  const { submitSuggestion } = useAvatars()

  const [name, setName] = useState(avatar.name)
  const [model, setModel] = useState(avatar.model)
  const [persona, setPersona] = useState(avatar.persona)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasChanges =
    name !== avatar.name ||
    model !== avatar.model ||
    persona !== avatar.persona

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasChanges) return

    setLoading(true)
    setError(null)

    const suggestedChanges: SuggestedChanges = {}
    if (name !== avatar.name) suggestedChanges.name = name
    if (model !== avatar.model) suggestedChanges.model = model
    if (persona !== avatar.persona) suggestedChanges.persona = persona

    try {
      await submitSuggestion(avatar.id, suggestedChanges, reason || undefined)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit suggestion')
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
          className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-2">Suggest Changes</h2>
            <p className="text-sm text-slate-400 mb-6">
              Propose changes to this public avatar. An admin will review your suggestion.
            </p>

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
                  className={`w-full px-4 py-2.5 bg-slate-800 border rounded-lg text-slate-100 outline-none transition-all ${
                    name !== avatar.name
                      ? 'border-blue-500 ring-1 ring-blue-500/20'
                      : 'border-slate-700'
                  }`}
                />
                {name !== avatar.name && (
                  <p className="mt-1 text-xs text-blue-400">Changed from: {avatar.name}</p>
                )}
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-slate-800 border rounded-lg text-slate-100 outline-none transition-all ${
                    model !== avatar.model
                      ? 'border-blue-500 ring-1 ring-blue-500/20'
                      : 'border-slate-700'
                  }`}
                >
                  {AVAILABLE_MODELS.map((m: string) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                {model !== avatar.model && (
                  <p className="mt-1 text-xs text-blue-400">Changed from: {avatar.model}</p>
                )}
              </div>

              {/* Persona */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Persona
                </label>
                <textarea
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  rows={6}
                  className={`w-full px-4 py-2.5 bg-slate-800 border rounded-lg text-slate-100 outline-none transition-all resize-none ${
                    persona !== avatar.persona
                      ? 'border-blue-500 ring-1 ring-blue-500/20'
                      : 'border-slate-700'
                  }`}
                />
                {persona !== avatar.persona && (
                  <p className="mt-1 text-xs text-blue-400">Persona has been modified</p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason for changes (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you think these changes would improve the avatar..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 outline-none transition-all resize-none"
                />
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
                  disabled={loading || !hasChanges}
                  className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Suggestion'}
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
