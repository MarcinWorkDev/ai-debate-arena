import { useState } from 'react'
import { updateDebate } from '../../lib/db'

interface ShareToggleProps {
  debateId: string
  isPublic: boolean
  publicSlug: string
  onUpdate?: () => void
}

export function ShareToggle({ debateId, isPublic, publicSlug, onUpdate }: ShareToggleProps) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = `${window.location.origin}/share/${publicSlug}`

  const handleToggle = async () => {
    setLoading(true)
    try {
      await updateDebate(debateId, { isPublic: !isPublic })
      onUpdate?.()
    } catch (err) {
      console.error('Error updating share status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          isPublic ? 'bg-green-600' : 'bg-slate-700'
        } ${loading ? 'opacity-50' : ''}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            isPublic ? 'left-7' : 'left-1'
          }`}
        />
      </button>
      <span className="text-slate-400 text-sm">
        {isPublic ? 'Public' : 'Private'}
      </span>

      {isPublic && (
        <button
          onClick={handleCopy}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded transition-colors flex items-center gap-1"
        >
          {copied ? (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Link
            </>
          )}
        </button>
      )}
    </div>
  )
}
