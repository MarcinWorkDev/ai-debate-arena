import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthGuard } from './components/auth/AuthGuard'
import { NoCredits } from './components/auth/NoCredits'
import { HomePage } from './pages/HomePage'
import { HistoryPage } from './pages/HistoryPage'
import { PublicDebatePage } from './pages/PublicDebatePage'
import { ViewDebatePage } from './pages/ViewDebatePage'
import { AdminPanel } from './components/admin/AdminPanel'
import { useAuth } from './hooks/useAuth'
import './styles/globals.css'

function ProtectedApp() {
  return <HomePage />
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
