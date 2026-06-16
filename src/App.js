import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PisProvider } from './context/PisContext'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Registro from './pages/auth/Registro'
import RecuperarContrasena from './pages/auth/RecuperarContrasena'
import AppShell from './components/AppShell'
import Inicio from './pages/dashboard/Inicio'
import Tareas from './pages/dashboard/Tareas'
import Gastos from './pages/dashboard/Gastos'
import Chat from './pages/dashboard/Chat'
import Calendario from './pages/dashboard/Calendario'
import Miembros from './pages/dashboard/Miembros'
import Soporte from './pages/dashboard/Soporte'
import ConfigPiso from './pages/dashboard/ConfigPiso'
import './index.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  return user ? <Navigate to="/app" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/registro" element={<PublicRoute><Registro /></PublicRoute>} />
          <Route path="/recuperar-contrasena" element={<PublicRoute><RecuperarContrasena /></PublicRoute>} />
          <Route path="/app/*" element={
            <ProtectedRoute>
              <PisProvider>
                <AppShell>
                  <Routes>
                    <Route path="/" element={<Inicio />} />
                    <Route path="/tareas" element={<Tareas />} />
                    <Route path="/gastos" element={<Gastos />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/calendario" element={<Calendario />} />
                    <Route path="/miembros" element={<Miembros />} />
                    <Route path="/soporte" element={<Soporte />} />
                    <Route path="/configuracion" element={<ConfigPiso />} />
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
