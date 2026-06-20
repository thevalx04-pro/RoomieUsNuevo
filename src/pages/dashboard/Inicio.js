import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

export default function Inicio() {
  const { perfil } = useAuth()
  const { pis, membres, crearPis, acceptarInvitacio } = usePis()
  const [stats, setStats] = useState({ pendientes: 0, hechas: 0, gastoTotal: 0 })
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
      <div className="topbar"><span className="topbar-title">¡Bienvenido, {perfil?.nom?.split(' ')[0]}! 👋</span></div>
      <div className="page-content" style={{ maxWidth: 520, margin: '0 auto' }}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="card animate-in-1">
          <div className="card-title">🏠 Crear un piso nuevo</div>
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
        <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--gray-400)', fontSize: 13 }}>— o —</div>
        <div className="card animate-in-2">
          <div className="card-title">🔑 Unirme a un piso existente</div>
          <form onSubmit={handleUnirse}>
            <div className="form-group">
              <label className="form-label">Código de invitación</label>
              <input className="form-input" placeholder="Ej: a3f7b2c1" value={codiInvit}
                onChange={e => setCodiInvit(e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Uniéndome...' : 'Unirme al piso'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  const total = stats.pendientes + stats.hechas
  const pct = total > 0 ? Math.round(stats.hechas / total * 100) : 0
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches'

  const eventoColors = { festa: 'var(--coral)', recordatori: 'var(--amber)', visita: 'var(--purple)', absencia: 'var(--gray-400)' }
  const eventoEmoji = { festa: '🎉', recordatori: '🔔', visita: '👋', absencia: '✈️' }

  return (
    <div>
      <div className="topbar">
        <div>
          <span className="topbar-title">{saludo}, {perfil?.nom?.split(' ')[0]}! 👋</span>
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--gray-400)', background: 'var(--gray-100)', padding: '5px 12px', borderRadius: 20, border: 'var(--border)' }}>
          🏠 {pis.nom} · {membres.length} residentes
        </span>
      </div>

      <div className="page-content">
        {/* Metric cards */}
        <div className="grid-4">
          {[
            { label: 'Tareas pendientes', val: stats.pendientes, color: 'coral', accent: 'coral-accent', icon: '⏳' },
            { label: 'Tareas hechas', val: stats.hechas, color: 'teal', accent: 'teal-accent', icon: '✅' },
            { label: 'Gastos registrados', val: stats.gastoTotal.toFixed(0) + '€', color: 'purple', accent: 'purple-accent', icon: '💰' },
            { label: 'Residentes', val: membres.length, color: 'amber', accent: 'amber-accent', icon: '👥' },
          ].map((m, i) => (
            <div key={m.label} className={`metric ${m.accent} animate-in-${i + 1}`}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
              <div className="metric-label">{m.label}</div>
              <div className={`metric-val ${m.color}`}>{m.val}</div>
            </div>
          ))}
        </div>

        <div className="grid-2">
          {/* Progreso tareas */}
          <div className="card animate-in-1">
            <div className="card-title">
              📋 Progreso de tareas
              <Link to="/app/tareas" style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 500 }}>Ver todas →</Link>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-400)', marginBottom: 10 }}>
              <span>{stats.hechas} completadas</span>
              <span style={{ fontWeight: 700, color: pct > 70 ? 'var(--teal)' : 'var(--amber)' }}>{pct}%</span>
            </div>
            <div className="progress-bar" style={{ height: 10 }}>
              <div className="progress-fill" style={{ width: pct + '%', background: pct > 70 ? 'linear-gradient(90deg, var(--teal), #2DCE96)' : 'linear-gradient(90deg, var(--amber), #F5A623)' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 8 }}>
              {stats.pendientes} tareas pendientes
            </div>
          </div>

          {/* Próximos eventos */}
          <div className="card animate-in-2">
            <div className="card-title">
              📅 Próximos eventos
              <Link to="/app/calendario" style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 500 }}>Ver todos →</Link>
            </div>
            {proximos.length === 0
              ? <div className="empty" style={{ padding: '16px 0' }}><p>Sin eventos próximos</p></div>
              : proximos.map(ev => (
                <div key={ev.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: 'var(--border)' }}>
                  <span style={{ fontSize: 18 }}>{eventoEmoji[ev.tipus] || '📌'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{ev.titol}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                      {new Date(ev.data).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: eventoColors[ev.tipus] || 'var(--purple)', flexShrink: 0 }} />
                </div>
              ))
            }
          </div>
        </div>

        {/* Residentes */}
        <div className="card animate-in-3">
          <div className="card-title">👥 Residentes del piso</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {membres.map(m => (
              <div key={m.id} className="member-chip">
                <div className="avatar sm">{m.usuaris?.nom?.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.usuaris?.nom}</div>
                  <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{m.rol === 'administrador' ? '⭐ Admin' : 'Residente'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
