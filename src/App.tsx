import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthGuard } from './components/auth/AuthGuard'
import { NoCredits } from './components/auth/NoCredits'
import { HomePage } from './pages/HomePage'
import { HistoryPage } from './pages/HistoryPage'
import { PublicDebatePage } from './pages/PublicDebatePage'
import { ViewDebatePage } from './pages/ViewDebatePage'
import { AvatarsPage } from './pages/AvatarsPage'
import { AdminPanel } from './components/admin/AdminPanel'
import { useAuth } from './hooks/useAuth'
import { useAvatars } from './hooks/useAvatars'
import './styles/globals.css'

// Component to handle avatar migration
function AvatarMigration() {
  const { runMigration, linkMigratedAvatars, migrationComplete } = useAvatars()
  const { user, profile } = useAuth()

  // Only run migration when an admin is logged in
  useEffect(() => {
    if (profile?.isAdmin && !migrationComplete) {
      runMigration()
    }
  }, [profile?.isAdmin, runMigration, migrationComplete])

  // Link migrated avatars when any user logs in
  useEffect(() => {
    if (user?.email && migrationComplete) {
      linkMigratedAvatars()
    }
  }, [user?.email, migrationComplete, linkMigratedAvatars])

  return null
}

function ProtectedApp() {
  return <HomePage />
}

function App() {
  return (
    <BrowserRouter>
      {/* Run migration on app load */}
      <AvatarMigration />

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
          path="/history"
          element={
            <AuthGuard>
              <HistoryPage />
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
          path="/avatars"
          element={
            <AuthGuard>
              <AvatarsPage />
            </AuthGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <AuthGuard requireAdmin>
              <AdminPanel />
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
