import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PisProvider } from './context/PisContext'
import Login from './pages/auth/Login'
import Registre from './pages/auth/Registre'
import RecuperarContrasenya from './pages/auth/RecuperarContrasenya'
import AppShell from './components/AppShell'
import Inici from './pages/dashboard/Inici'
import Tasques from './pages/dashboard/Tasques'
import Despeses from './pages/dashboard/Despeses'
import Xat from './pages/dashboard/Xat'
import Calendari from './pages/dashboard/Calendari'
import Membres from './pages/dashboard/Membres'
import Suport from './pages/dashboard/Suport'
import ConfigPis from './pages/dashboard/ConfigPis'
import './index.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/registre" element={<PublicRoute><Registre /></PublicRoute>} />
          <Route path="/recuperar-contrasenya" element={<PublicRoute><RecuperarContrasenya /></PublicRoute>} />
          <Route path="/*" element={
            <ProtectedRoute>
              <PisProvider>
                <AppShell>
                  <Routes>
                    <Route path="/" element={<Inici />} />
                    <Route path="/tasques" element={<Tasques />} />
                    <Route path="/despeses" element={<Despeses />} />
                    <Route path="/xat" element={<Xat />} />
                    <Route path="/calendari" element={<Calendari />} />
                    <Route path="/membres" element={<Membres />} />
                    <Route path="/suport" element={<Suport />} />
                    <Route path="/configuracio" element={<ConfigPis />} />
                  </Routes>
                </AppShell>
              </PisProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
