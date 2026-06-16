import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

export default function Inicio() {
  const { perfil } = useAuth()
  const { pis, membres, crearPis, acceptarInvitacio } = usePis()
  const [stats, setStats] = useState({ pendientes: 0, hechas: 0, gastoTotal: 0, pendientePago: 0 })
  const [proximos, setProximos] = useState([])
  const [formPiso, setFormPiso] = useState({ nom: '', limit: 4, normes: '' })
  const [codiInvit, setCodiInvit] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!pis) return
    fetchStats()
    fetchEventos()
  }, [pis])

  async function fetchStats() {
    const [tareas, gastos] = await Promise.all([
      supabase.from('tasques').select('estat').eq('pis_id', pis.id),
      supabase.from('despeses').select('import_total').eq('pis_id', pis.id),
    ])
    const t = tareas.data || []
    const d = gastos.data || []
    setStats({
      pendientes: t.filter(x => x.estat === 'pendent').length,
      hechas: t.filter(x => x.estat === 'completada').length,
      gastoTotal: d.reduce((a, x) => a + parseFloat(x.import_total), 0),
      pendientePago: 0
    })
  }

  async function fetchEventos() {
    const { data } = await supabase.from('esdeveniments')
      .select('*').eq('pis_id', pis.id)
      .gte('data', new Date().toISOString())
      .order('data', { ascending: true }).limit(4)
    setProximos(data || [])
  }

  async function handleCrearPiso(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try { await crearPis(formPiso.nom, parseInt(formPiso.limit), formPiso.normes) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleUnirse(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try { await acceptarInvitacio(codiInvit) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  if (!pis) return (
    <div>
      <div className="topbar"><span className="topbar-title">¡Bienvenido, {perfil?.nom?.split(' ')[0]}!</span></div>
      <div className="page-content" style={{ maxWidth: 500, margin: '0 auto' }}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="card">
          <div className="card-title">Crear un piso nuevo</div>
          <form onSubmit={handleCrearPiso}>
            <div className="form-group">
              <label className="form-label">Nombre del piso</label>
              <input className="form-input" placeholder="Ej: Piso Calle Mayor" value={formPiso.nom}
                onChange={e => setFormPiso(f => ({ ...f, nom: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Límite de residentes</label>
              <input className="form-input" type="number" min="2" max="10" value={formPiso.limit}
                onChange={e => setFormPiso(f => ({ ...f, limit: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Normas internas (opcional)</label>
              <textarea className="form-input" placeholder="Ej: No fumar, silencio a las 23h..."
                value={formPiso.normes} onChange={e => setFormPiso(f => ({ ...f, normes: e.target.value }))} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Creando...' : 'Crear piso'}
            </button>
          </form>
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">Unirme a un piso existente</div>
          <form onSubmit={handleUnirse}>
            <div className="form-group">
              <label className="form-label">Código de invitación</label>
              <input className="form-input" placeholder="Ej: a3f7b2c1" value={codiInvit}
                onChange={e => setCodiInvit(e.target.value)} required />
            </div>
            <button className="btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Uniéndome...' : 'Unirme al piso'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  const total = stats.pendientes + stats.hechas
  const pct = total > 0 ? Math.round(stats.hechas / total * 100) : 0

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">¡Hola, {perfil?.nom?.split(' ')[0]}!</span>
        <div className="topbar-actions">
          <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{membres.length} residentes · {pis.nom}</span>
        </div>
      </div>
      <div className="page-content">
        <div className="grid-4">
          <div className="metric"><div className="metric-label">Tareas pendientes</div><div className="metric-val coral">{stats.pendientes}</div></div>
          <div className="metric"><div className="metric-label">Tareas hechas</div><div className="metric-val teal">{stats.hechas}</div></div>
          <div className="metric"><div className="metric-label">Gastos del mes</div><div className="metric-val purple">{stats.gastoTotal.toFixed(2)}€</div></div>
          <div className="metric"><div className="metric-label">Residentes</div><div className="metric-val amber">{membres.length}</div></div>
        </div>
        <div className="grid-2">
          <div className="card">
            <div className="card-title">Progreso de tareas
              <Link to="/app/tareas" style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 400 }}>Ver todas →</Link>
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 6 }}>{stats.hechas} de {total} completadas ({pct}%)</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
          </div>
          <div className="card">
            <div className="card-title">Próximos eventos
              <Link to="/app/calendario" style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 400 }}>Ver todos →</Link>
            </div>
            {proximos.length === 0 && <div className="empty"><p>Sin eventos próximos</p></div>}
            {proximos.map(ev => (
              <div key={ev.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: 'var(--border)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: ev.tipus === 'festa' ? 'var(--coral)' : ev.tipus === 'recordatori' ? 'var(--amber)' : 'var(--purple)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13 }}>{ev.titol}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{new Date(ev.data).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Residentes del piso</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {membres.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--gray-100)', borderRadius: 'var(--radius-md)', padding: '6px 10px' }}>
                <div className="avatar sm">{m.usuaris?.nom?.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{m.usuaris?.nom}</div>
                  <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{m.rol === 'administrador' ? 'Admin' : 'Residente'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
