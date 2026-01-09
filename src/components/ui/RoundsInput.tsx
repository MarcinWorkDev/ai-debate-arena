import { useDebateStore } from '../../stores/debateStore'

export function RoundsInput() {
  const { maxRounds, status, setMaxRounds, userName, setUserName } = useDebateStore()

  if (status !== 'idle') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
          <span className="text-xs text-slate-400">Round</span>
          <span className="text-sm font-semibold text-slate-200">
            {useDebateStore.getState().roundCount}/{maxRounds}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-500/20 border border-pink-500/30">
          <span className="text-xs text-pink-300">You:</span>
          <span className="text-sm font-semibold text-pink-200">{userName}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
        <span className="text-xs text-slate-400 whitespace-nowrap">Rounds</span>
        <input
          type="number"
          min={1}
          max={100}
          value={maxRounds}
          onChange={(e) => setMaxRounds(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
          className="w-14 px-2 py-0.5 text-sm font-semibold text-slate-200 bg-slate-700 rounded border border-slate-600 text-center focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-500/20 border border-pink-500/30">
        <span className="text-xs text-pink-300 whitespace-nowrap">Your name</span>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="You"
          className="w-24 px-2 py-0.5 text-sm font-semibold text-pink-200 bg-pink-500/10 rounded border border-pink-500/20 focus:outline-none focus:border-pink-400 placeholder-pink-400/50"
        />
      </div>
    </div>
  )
}
