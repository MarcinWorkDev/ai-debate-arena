import { motion } from 'framer-motion'
import type { Agent } from '../../lib/agents'

interface TypingIndicatorProps {
  agent: Agent
}

export function TypingIndicator({ agent }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2"
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: agent.color }}
      />
      <span className="text-sm font-semibold" style={{ color: agent.color }}>
        {agent.name}
      </span>
      <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5 rounded bg-slate-800">
        {agent.model}
      </span>
      <div className="flex gap-1 ml-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-500"
            animate={{
              y: [0, -4, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.12,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
