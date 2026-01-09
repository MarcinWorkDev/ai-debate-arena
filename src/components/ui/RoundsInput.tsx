import { useDebateStore } from '../../stores/debateStore'

export function RoundsInput() {
  const { maxRounds, status, setMaxRounds } = useDebateStore()

  if (status !== 'idle') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
        <span className="text-xs text-slate-400">Round</span>
        <span className="text-sm font-semibold text-slate-200">
          {useDebateStore.getState().roundCount}/{maxRounds}
        </span>
      </div>
    )
  }

  return (
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
  )
}
