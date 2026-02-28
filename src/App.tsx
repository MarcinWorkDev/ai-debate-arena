import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthGuard } from './components/auth/AuthGuard'
import { NoCredits } from './components/auth/NoCredits'
import { DebatePage } from './modules/debate/pages/DebatePage'
import { ViewDebatePage } from './modules/debate/pages/ViewDebatePage'
import { PublicDebatePage } from './modules/debate/pages/PublicDebatePage'
import './styles/globals.css'

// Lazy-loaded pages
const UserPage = lazy(() => import('./modules/user/pages/UserPage'))
const UserAvatarsPage = lazy(() => import('./modules/user/pages/UserAvatarsPage'))
const PublicAvatarsPage = lazy(() => import('./modules/user/pages/PublicAvatarsPage'))
const UserDebatesPage = lazy(() => import('./modules/user/pages/UserDebatesPage'))
const AdminDashboard = lazy(() => import('./modules/admin/pages/AdminDashboard'))
const AdminUserViewPage = lazy(() => import('./modules/admin/pages/AdminUserViewPage'))

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-slate-400">Loading...</div>
  </div>
)

function ProtectedApp() {
  return <DebatePage />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route - shared debates */}
        <Route path="/share/:slug" element={<PublicDebatePage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <ProtectedApp />
            </AuthGuard>
          }
        />
        <Route
          path="/user"
          element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <UserPage />
              </Suspense>
            </AuthGuard>
          }
        />
        <Route
          path="/user/debates"
          element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <UserDebatesPage />
              </Suspense>
            </AuthGuard>
          }
        />
        <Route
          path="/user/avatars"
          element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <UserAvatarsPage />
              </Suspense>
            </AuthGuard>
          }
        />
        <Route
          path="/user/avatars/public"
          element={
            <AuthGuard>
              <Suspense fallback={<PageLoader />}>
                <PublicAvatarsPage />
              </Suspense>
            </AuthGuard>
          }
        />
        <Route
          path="/debate/:id"
          element={
            <AuthGuard>
              <ViewDebatePage />
            </AuthGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <AuthGuard requireAdmin>
              <Suspense fallback={<PageLoader />}>
                <AdminDashboard />
              </Suspense>
            </AuthGuard>
          }
        />
        <Route
          path="/admin/user/:userId"
          element={
            <AuthGuard requireAdmin>
              <Suspense fallback={<PageLoader />}>
                <AdminUserViewPage />
              </Suspense>
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
