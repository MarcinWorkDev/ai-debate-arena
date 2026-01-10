import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { usePageScroll } from '../../../shared/hooks/usePageScroll'
import { PageLayout } from '../../../shared/layout/PageLayout'
import { PageHeader } from '../../../shared/layout/PageHeader'
import { UserDebateList } from '../components/UserDebateList'

export function UserDebatesPage() {
  const { profile, logout } = useAuth()

  usePageScroll()

  return (
    <PageLayout
      maxWidth="4xl"
      header={
        <PageHeader maxWidth="4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">My Debates</h1>
              <p className="text-sm text-slate-400">View and share your debate history</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-white text-sm">{profile?.displayName}</div>
                <div className="text-slate-400 text-xs">
                  {profile?.creditsAvailable} credits available
                </div>
              </div>
              <Link
                to="/"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
              >
                New Debate
              </Link>
              {profile?.isAdmin && (
                <Link
                  to="/admin"
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </PageHeader>
      }
    >
      <UserDebateList />
    </PageLayout>
  )
}

