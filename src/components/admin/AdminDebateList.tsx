import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllDebates, type Debate } from '../../lib/db'

export function AdminDebateList() {
  const [debates, setDebates] = useState<Debate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await getAllDebates()
        setDebates(data)
      } catch (err) {
        console.error('Error loading debates:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-800/50">
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Topic</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Credits Used</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Public</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {debates.map((debate) => (
            <tr key={debate.id} className="hover:bg-slate-800/30">
              <td className="px-4 py-4">
                <Link
                  to={`/debate/${debate.id}`}
                  className="block"
                >
                  <div className="text-white font-medium truncate max-w-xs hover:text-blue-400 transition-colors">{debate.title}</div>
                  <div className="text-slate-500 text-xs font-mono">{debate.id}</div>
                </Link>
              </td>
              <td className="px-4 py-4">
                <Link
                  to={`/debate/${debate.id}`}
                  className="block"
                >
                  <div className="text-slate-400 text-sm font-mono truncate max-w-[120px] hover:text-blue-400 transition-colors">{debate.userId}</div>
                </Link>
              </td>
              <td className="px-4 py-4">
                <Link
                  to={`/debate/${debate.id}`}
                  className="block"
                >
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    debate.status === 'finished'
                      ? 'bg-green-500/20 text-green-400'
                      : debate.status === 'running'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {debate.status}
                  </span>
                </Link>
              </td>
              <td className="px-4 py-4">
                <Link
                  to={`/debate/${debate.id}`}
                  className="block text-white hover:text-blue-400 transition-colors"
                >
                  {debate.creditsUsed}
                </Link>
              </td>
              <td className="px-4 py-4">
                {debate.isPublic ? (
                  <a
                    href={`/share/${debate.publicSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {debate.publicSlug}
                  </a>
                ) : (
                  <Link
                    to={`/debate/${debate.id}`}
                    className="block text-slate-500 text-sm hover:text-blue-400 transition-colors"
                  >
                    Private
                  </Link>
                )}
              </td>
              <td className="px-4 py-4">
                <Link
                  to={`/debate/${debate.id}`}
                  className="block text-slate-400 text-sm hover:text-blue-400 transition-colors"
                >
                  {debate.createdAt.toLocaleDateString()}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {debates.length === 0 && (
        <div className="px-4 py-8 text-center text-slate-400">No debates found</div>
      )}
    </div>
  )
}
