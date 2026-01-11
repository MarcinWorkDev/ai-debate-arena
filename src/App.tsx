import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthGuard } from './components/auth/AuthGuard'
import { NoCredits } from './components/auth/NoCredits'
import { DebatePage } from './modules/debate/pages/DebatePage'
import { ViewDebatePage } from './modules/debate/pages/ViewDebatePage'
import { PublicDebatePage } from './modules/debate/pages/PublicDebatePage'
import { UserAvatarsPage } from './modules/user/pages/UserAvatarsPage'
import { PublicAvatarsPage } from './modules/user/pages/PublicAvatarsPage'
import { UserDebatesPage } from './modules/user/pages/UserDebatesPage'
import { UserPage } from './modules/user/pages/UserPage'
import { AdminDashboard } from './modules/admin/pages/AdminDashboard'
import { AdminUserViewPage } from './modules/admin/pages/AdminUserViewPage'
import './styles/globals.css'

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
              <UserPage />
            </AuthGuard>
          }
        />
        <Route
          path="/user/debates"
          element={
            <AuthGuard>
              <UserDebatesPage />
            </AuthGuard>
          }
        />
        <Route
          path="/user/avatars"
          element={
            <AuthGuard>
              <UserAvatarsPage />
            </AuthGuard>
          }
        />
        <Route
          path="/user/avatars/public"
          element={
            <AuthGuard>
              <PublicAvatarsPage />
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
              <AdminDashboard />
            </AuthGuard>
          }
        />
        <Route
          path="/admin/user/:userId"
          element={
            <AuthGuard requireAdmin>
              <AdminUserViewPage />
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
