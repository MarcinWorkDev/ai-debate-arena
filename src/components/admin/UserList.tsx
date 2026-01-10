import { useState, useEffect } from 'react'
import { getAllUsers, approveUser, blockUser, unblockUser, assignCredits, setUserCredits } from '../../lib/db'

interface User {
  uid: string
  email: string
  displayName: string
  photoURL: string
  createdAt: Date
  isAdmin: boolean
  isApproved: boolean
  isBlocked: boolean
  creditsAvailable: number
  creditsUsed: number
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [creditsInput, setCreditsInput] = useState<Record<string, string>>({})

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getAllUsers()
      setUsers(data as User[])
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleApprove = async (uid: string) => {
    await approveUser(uid)
    loadUsers()
  }

  const handleBlock = async (uid: string) => {
    await blockUser(uid)
    loadUsers()
  }

  const handleUnblock = async (uid: string) => {
    await unblockUser(uid)
    loadUsers()
  }

  const handleAddCredits = async (uid: string) => {
    const amount = parseInt(creditsInput[uid] || '0', 10)
    if (amount > 0) {
      await assignCredits(uid, amount)
      setCreditsInput(prev => ({ ...prev, [uid]: '' }))
      loadUsers()
    }
  }

  const handleSetCredits = async (uid: string) => {
    const amount = parseInt(creditsInput[uid] || '0', 10)
    if (amount >= 0) {
      await setUserCredits(uid, amount)
      setCreditsInput(prev => ({ ...prev, [uid]: '' }))
      loadUsers()
    }
  }

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
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Credits</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {users.map((user) => (
            <tr key={user.uid} className="hover:bg-slate-800/30">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 overflow-hidden">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt=""
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement!.textContent = user.displayName?.[0] || user.email?.[0] || '?'
                        }}
                      />
                    ) : (
                      user.displayName?.[0] || user.email?.[0] || '?'
                    )}
                  </div>
                  <div>
                    <div className="text-white font-medium">{user.displayName || 'No name'}</div>
                    <div className="text-slate-400 text-sm">{user.email}</div>
                  </div>
                  {user.isAdmin && (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">Admin</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-4">
                {user.isBlocked ? (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">Blocked</span>
                ) : user.isApproved ? (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Approved</span>
                ) : (
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">Pending</span>
                )}
              </td>
              <td className="px-4 py-4">
                <div className="text-white">{user.creditsAvailable} available</div>
                <div className="text-slate-400 text-sm">{user.creditsUsed} used</div>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  {!user.isApproved && !user.isBlocked && (
                    <button
                      onClick={() => handleApprove(user.uid)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  {user.isBlocked ? (
                    <button
                      onClick={() => handleUnblock(user.uid)}
                      className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded transition-colors"
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBlock(user.uid)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                    >
                      Block
                    </button>
                  )}
                  <div className="flex items-center gap-1 ml-2">
                    <input
                      type="number"
                      value={creditsInput[user.uid] || ''}
                      onChange={(e) => setCreditsInput(prev => ({ ...prev, [user.uid]: e.target.value }))}
                      placeholder="Credits"
                      className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-xs"
                    />
                    <button
                      onClick={() => handleAddCredits(user.uid)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                      title="Add to current credits"
                    >
                      +Add
                    </button>
                    <button
                      onClick={() => handleSetCredits(user.uid)}
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded transition-colors"
                      title="Set exact credit amount"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="px-4 py-8 text-center text-slate-400">No users found</div>
      )}
    </div>
  )
}
