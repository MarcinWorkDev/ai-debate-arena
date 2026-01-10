import { useState } from 'react'
import { useDebate } from '../../hooks/useDebate'
import { NoCreditsModal } from './NoCreditsModal'

export function TopicInput() {
  const { topic, setTopic, status, startDebate } = useDebate()
  const [isFocused, setIsFocused] = useState(false)
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (topic.trim() && status === 'idle') {
      const result = await startDebate()
      if (result === false) {
        // No credits available
        setShowNoCreditsModal(true)
      }
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Discussion Topic
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="e.g. The future of artificial intelligence..."
          disabled={status !== 'idle'}
          className={`w-full px-4 py-2.5 bg-slate-800 border rounded-lg
                     text-slate-100 placeholder-slate-500 outline-none
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     ${isFocused ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-700'}`}
        />
      </form>
      <NoCreditsModal
        isOpen={showNoCreditsModal}
        onClose={() => setShowNoCreditsModal(false)}
      />
    </>
  )
}
