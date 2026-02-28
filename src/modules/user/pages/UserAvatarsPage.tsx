import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { useAvatars } from '../../../hooks/useAvatars'
import { usePageScroll } from '../../../shared/hooks/usePageScroll'
import { PageLayout } from '../../../shared/layout/PageLayout'
import { PageHeader } from '../../../shared/layout/PageHeader'
import { UserAvatarList } from '../components/UserAvatarList'

export function UserAvatarsPage() {
  const { profile } = useAuth()
  const {
    userAvatars,
    loading,
    loadUserAvatars,
  } = useAvatars()

  usePageScroll()

  useEffect(() => {
    loadUserAvatars()
  }, [loadUserAvatars])

  return (
    <PageLayout
      header={
        <PageHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                &larr; Back to Debate
              </Link>
              <h1 className="text-xl font-semibold text-white">My Avatars</h1>
            </div>
            <div className="flex items-center gap-3">
              {profile?.isAdmin && (
                <Link
                  to="/admin"
                  className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        </PageHeader>
      }
    >
      <UserAvatarList
        avatars={userAvatars}
        loading={loading}
        onRefresh={loadUserAvatars}
      />
    </PageLayout>
  )
}


export default UserAvatarsPage
