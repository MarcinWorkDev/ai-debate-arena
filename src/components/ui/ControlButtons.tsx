import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDebate } from '../../hooks/useDebate'
import { NoCreditsModal } from './NoCreditsModal'

export function ControlButtons() {
  const { status, startDebate, pauseDebate, resumeDebate, resetDebate, topic } = useDebate()
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false)

  const handleStartDebate = async () => {
    const result = await startDebate()
    if (result === false) {
      // No credits available
      setShowNoCreditsModal(true)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        {status === 'idle' && (
          <Button
            onClick={handleStartDebate}
            disabled={!topic.trim()}
            variant="primary"
          >
            Start Debate
          </Button>
        )}

      {status === 'running' && (
        <Button onClick={pauseDebate} variant="warning">
          Pause
        </Button>
      )}

      {status === 'paused' && (
        <>
          <Button onClick={resumeDebate} variant="primary">
            Resume
          </Button>
          <Button onClick={resetDebate} variant="danger">
            Reset
          </Button>
        </>
      )}

      {status === 'finished' && (
        <Button onClick={resetDebate} variant="secondary">
          New Debate
        </Button>
      )}
      </div>
      <NoCreditsModal
        isOpen={showNoCreditsModal}
        onClose={() => setShowNoCreditsModal(false)}
      />
    </>
  )
}

interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  variant: 'primary' | 'secondary' | 'warning' | 'danger'
}

const variantStyles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-slate-600 hover:bg-slate-700 text-white',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  danger: 'bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white',
}

function Button({ children, onClick, disabled, variant }: ButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`px-5 py-2 rounded-lg font-medium text-sm
                 transition-all duration-200
                 disabled:opacity-40 disabled:cursor-not-allowed
                 ${variantStyles[variant]}`}
    >
      {children}
    </motion.button>
  )
}
