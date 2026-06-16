import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePis } from '../context/PisContext'

const NAV = [
  { to: '/app', label: 'Inicio', icon: IconHome, end: true },
  { to: '/app/tareas', label: 'Tareas', icon: IconCheck },
  { to: '/app/gastos', label: 'Gastos', icon: IconReceipt },
  { to: '/app/chat', label: 'Chat del piso', icon: IconMsg },
  { to: '/app/calendario', label: 'Calendario', icon: IconCal },
]
const NAV2 = [
  { to: '/app/miembros', label: 'Miembros', icon: IconUsers },
  { to: '/app/soporte', label: 'Soporte', icon: IconHelp },
]

export default function AppShell({ children }) {
  const { perfil, tancarSessio } = useAuth()
  const { pis, rolUsuari } = usePis()
  const navigate = useNavigate()

  async function handleLogout() {
    await tancarSessio()
    navigate('/login')
  }

  const inicials = perfil?.nom?.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() || 'U'

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-text">RoomieUs</div>
          <div className="pis-name">{pis ? pis.nom : 'Sin piso asignado'}</div>
        </div>
        <nav className="nav">
          <div className="nav-section-label">Principal</div>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <Icon />{label}
            </NavLink>
          ))}
          <div className="nav-section-label" style={{ marginTop: 8 }}>Gestión</div>
          {NAV2.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <Icon />{label}
            </NavLink>
          ))}
          {rolUsuari === 'administrador' && (
            <NavLink to="/app/configuracion" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <IconSettings />Configuración
            </NavLink>
          )}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{inicials}</div>
          <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
            <div className="name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perfil?.nom}</div>
            <div className="role">{rolUsuari === 'administrador' ? 'Administrador' : 'Residente'}</div>
          </div>
          <button className="btn-icon btn" onClick={handleLogout} title="Cerrar sesión"><IconLogout /></button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}

function IconHome() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg> }
function IconCheck() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M9 12l2 2 4-4"/><path d="M3 9h18"/></svg> }
function IconReceipt() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 2v20l3-2 2 2 3-2 3 2 2-2 3 2V2l-3 2-2-2-3 2-3-2-2 2-3-2z"/><path d="M8 10h8M8 14h5"/></svg> }
function IconMsg() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> }
function IconCal() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> }
function IconUsers() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/></svg> }
function IconHelp() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg> }
function IconSettings() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> }
function IconLogout() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg> }
