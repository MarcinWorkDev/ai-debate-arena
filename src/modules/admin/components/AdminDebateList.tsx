import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllDebates, getAllUsers, type Debate } from '../../../lib/db'
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner'
import { StatusBadge } from '../../../shared/ui/StatusBadge'

export function AdminDebateList() {
  const [debates, setDebates] = useState<Debate[]>([])
  const [userEmailMap, setUserEmailMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [debatesData, usersData] = await Promise.all([
          getAllDebates(),
          getAllUsers()
        ])
        setDebates(debatesData)
        
        // Create a map of userId -> email
        const emailMap: Record<string, string> = {}
        usersData.forEach((user: any) => {
          if (user.uid && user.email) {
            emailMap[user.uid] = user.email
          }
        })
        setUserEmailMap(emailMap)
      } catch (err) {
        console.error('Error loading debates:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <LoadingSpinner size="sm" className="py-12" />
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-800/50">
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Topic</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User Email</th>
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
                  to={`/debate/${debate.id}?from=admin`}
                  className="block"
                >
                  <div className="text-white font-medium truncate max-w-xs hover:text-blue-400 transition-colors">{debate.title}</div>
                  <div className="text-slate-500 text-xs font-mono">{debate.id}</div>
                </Link>
              </td>
              <td className="px-4 py-4">
                <Link
                  to={`/admin/user/${debate.userId}`}
                  className="block"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-slate-400 text-sm truncate max-w-[200px] hover:text-blue-400 transition-colors">
                    {userEmailMap[debate.userId] || debate.userId}
                  </div>
                </Link>
              </td>
              <td className="px-4 py-4">
                <Link
                  to={`/debate/${debate.id}?from=admin`}
                  className="block"
                >
                  <StatusBadge status={debate.status} type="debate" />
                </Link>
              </td>
              <td className="px-4 py-4">
                <Link
                  to={`/debate/${debate.id}?from=admin`}
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
                    to={`/debate/${debate.id}?from=admin`}
                    className="block text-slate-500 text-sm hover:text-blue-400 transition-colors"
                  >
                    Private
                  </Link>
                )}
              </td>
              <td className="px-4 py-4">
                <Link
                  to={`/debate/${debate.id}?from=admin`}
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
