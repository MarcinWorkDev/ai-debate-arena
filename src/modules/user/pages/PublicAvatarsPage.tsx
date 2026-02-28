import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { useAvatars } from '../../../hooks/useAvatars'
import { usePageScroll } from '../../../shared/hooks/usePageScroll'
import { PageLayout } from '../../../shared/layout/PageLayout'
import { PageHeader } from '../../../shared/layout/PageHeader'
import { PublicAvatarList } from '../components/PublicAvatarList'

export function PublicAvatarsPage() {
  const { profile } = useAuth()
  const {
    publicAvatars,
    loading,
    loadPublicAvatars,
  } = useAvatars()

  usePageScroll()

  useEffect(() => {
    loadPublicAvatars()
  }, [loadPublicAvatars])

  return (
    <PageLayout
      header={
        <PageHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                &larr; Back to Debate
              </Link>
              <h1 className="text-xl font-semibold text-white">Public Avatars</h1>
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
      <PublicAvatarList
        avatars={publicAvatars}
        loading={loading}
      />
    </PageLayout>
  )
}


export default PublicAvatarsPage
