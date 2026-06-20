import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

const FREQ = { diaria: 'Diaria', setmanal: 'Semanal', mensual: 'Mensual', puntual: 'Puntual' }
const FREQ_COLOR = { diaria: 'var(--coral)', setmanal: 'var(--purple)', mensual: 'var(--teal)', puntual: 'var(--amber)' }
const FREQ_ICON = { diaria: '🔄', setmanal: '📅', mensual: '🗓️', puntual: '📌' }

export default function Tareas() {
  const { user } = useAuth()
  const { pis, membres, rolUsuari } = usePis()
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nom: '', descripcio: '', frequencia: 'setmanal', assignat_id: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [filtro, setFiltro] = useState('todas')

  useEffect(() => { if (pis) fetchTareas() }, [pis])

  async function fetchTareas() {
    const { data } = await supabase
      .from('tasques')
      .select('*, assignacions_tasca(*, membres_pis(*, usuaris(nom)))')
      .eq('pis_id', pis.id)
      .order('data_creacio', { ascending: false })
    setTareas(data || [])
    setLoading(false)
  }

  async function toggleTarea(tarea) {
    const nuevoEstado = tarea.estat === 'completada' ? 'pendent' : 'completada'
    setTareas(prev => prev.map(t => t.id === tarea.id ? { ...t, estat: nuevoEstado } : t))
    await supabase.from('tasques').update({ estat: nuevoEstado }).eq('id', tarea.id)
  }

  async function eliminarTarea(id) {
    if (!window.confirm('¿Seguro que quieres eliminar esta tarea?')) return
    setTareas(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasques').delete().eq('id', id)
  }

  async function guardarTarea(e) {
    e.preventDefault()
    if (!form.nom.trim()) return setError('El nombre no puede estar vacío')
    setSaving(true); setError('')
    try {
      const { data: nueva } = await supabase.from('tasques')
        .insert({ pis_id: pis.id, nom: form.nom, descripcio: form.descripcio, frequencia: form.frequencia })
        .select().single()
      if (form.assignat_id) {
        await supabase.from('assignacions_tasca').insert({ tasca_id: nueva.id, membre_id: form.assignat_id })
      }
      setModal(false)
      setForm({ nom: '', descripcio: '', frequencia: 'setmanal', assignat_id: '' })
      fetchTareas()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const completadas = tareas.filter(t => t.estat === 'completada').length
  const pct = tareas.length > 0 ? Math.round(completadas / tareas.length * 100) : 0
  const tareasFiltradas = tareas.filter(t => {
    if (filtro === 'pendientes') return t.estat !== 'completada'
    if (filtro === 'hechas') return t.estat === 'completada'
    if (filtro === 'mias') return t.assignacions_tasca?.[0]?.membres_pis?.usuaris?.nom === membres.find(m => m.usuaris_id === user.id)?.usuaris?.nom
    return true
  })

  if (!pis) return <div className="page-content"><div className="empty"><p>Primero debes crear o unirte a un piso.</p></div></div>

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">✅ Tareas del hogar</span>
        {rolUsuari === 'administrador' && (
          <button className="btn btn-primary" onClick={() => setModal(true)}>+ Nueva tarea</button>
        )}
      </div>
      <div className="page-content">
        {/* Métricas */}
        <div className="grid-4">
          {[
            { label: 'Total', val: tareas.length, color: 'purple', accent: 'purple-accent', icon: '📋' },
            { label: 'Completadas', val: completadas, color: 'teal', accent: 'teal-accent', icon: '✅' },
            { label: 'Pendientes', val: tareas.length - completadas, color: 'coral', accent: 'coral-accent', icon: '⏳' },
            { label: '% Completado', val: pct + '%', color: pct > 70 ? 'teal' : 'amber', accent: pct > 70 ? 'teal-accent' : 'amber-accent', icon: '📊' },
          ].map((m, i) => (
            <div key={m.label} className={`metric ${m.accent} animate-in-${i+1}`}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
              <div className="metric-label">{m.label}</div>
              <div className={`metric-val ${m.color}`}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Barra de progreso */}
        <div className="card animate-in-1">
          <div className="card-title">Progreso general</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-400)', marginBottom: 8 }}>
            <span>{completadas} de {tareas.length} tareas completadas</span>
            <span style={{ fontWeight: 700, color: pct > 70 ? 'var(--teal)' : 'var(--amber)' }}>{pct}%</span>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div className="progress-fill" style={{
              width: pct + '%',
              background: pct === 100 ? 'linear-gradient(90deg, var(--teal), #2DCE96)'
                : pct > 60 ? 'linear-gradient(90deg, var(--teal), var(--amber))'
                : 'linear-gradient(90deg, var(--amber), var(--coral))'
            }} />
          </div>
          {pct === 100 && (
            <div style={{ marginTop: 10, textAlign: 'center', color: 'var(--teal)', fontWeight: 600, fontSize: 13 }}>
              🎉 ¡Todas las tareas completadas!
            </div>
          )}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['todas', 'pendientes', 'hechas'].map(f => (
            <button
              key={f}
              className="btn btn-sm"
              style={filtro === f ? { background: 'var(--purple)', color: '#fff', borderColor: 'var(--purple)' } : {}}
              onClick={() => setFiltro(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pendientes' && tareas.filter(t => t.estat !== 'completada').length > 0 && (
                <span style={{ background: 'var(--coral)', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>
                  {tareas.filter(t => t.estat !== 'completada').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lista de tareas */}
        {loading && <div className="loading-center"><div className="spinner" /></div>}
        {!loading && tareasFiltradas.length === 0 && (
          <div className="card">
            <div className="empty">
              <div style={{ fontSize: 40 }}>📋</div>
              <p>{filtro === 'todas' ? 'Sin tareas todavía. ¡Crea la primera!' : 'Sin tareas en esta categoría.'}</p>
            </div>
          </div>
        )}

        {tareasFiltradas.map((t, i) => {
          const asignado = t.assignacions_tasca?.[0]?.membres_pis?.usuaris?.nom
          const esMia = membres.find(m => m.id === t.assignacions_tasca?.[0]?.membre_id)?.usuaris_id === user.id
          return (
            <div
              key={t.id}
              className={`task-row ${t.estat === 'completada' ? 'done' : ''}`}
              style={{ animation: `fadeIn 0.3s ease ${i * 0.04}s both` }}
            >
              <button
                className={`task-check ${t.estat === 'completada' ? 'done' : ''}`}
                onClick={() => toggleTarea(t)}
                title={t.estat === 'completada' ? 'Marcar pendiente' : 'Marcar completada'}
              >
                {t.estat === 'completada' && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>

              <div style={{ flex: 1 }}>
                <div className={`task-name ${t.estat === 'completada' ? 'done' : ''}`}>
                  {esMia && t.estat !== 'completada' && <span style={{ marginRight: 4 }}>👤</span>}
                  {t.nom}
                </div>
                <div className="task-meta">
                  <span style={{ color: FREQ_COLOR[t.frequencia] || 'var(--gray-400)' }}>
                    {FREQ_ICON[t.frequencia]} {FREQ[t.frequencia]}
                  </span>
                  {' · '}
                  <span>{asignado || 'Sin asignar'}</span>
                  {t.descripcio && <span> · {t.descripcio}</span>}
                </div>
              </div>

              <span className={`badge ${t.estat === 'completada' ? 'badge-completada' : 'badge-pendent'}`}>
                {t.estat === 'completada' ? '✓ Hecha' : '⏳ Pendiente'}
              </span>

              {rolUsuari === 'administrador' && (
                <button className="btn btn-sm" style={{ color: 'var(--coral)', borderColor: 'transparent', background: 'none' }} onClick={() => eliminarTarea(t.id)} title="Eliminar">🗑</button>
              )}
            </div>
          )
        })}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-title">✅ Nueva tarea</div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={guardarTarea}>
              <div className="form-group">
                <label className="form-label">Nombre de la tarea</label>
                <input className="form-input" placeholder="Ej: Limpiar el baño" value={form.nom} onChange={set('nom')} required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción (opcional)</label>
                <textarea className="form-input" placeholder="Detalles adicionales..." value={form.descripcio} onChange={set('descripcio')} />
              </div>
              <div className="form-group">
                <label className="form-label">Frecuencia</label>
                <select className="form-input" value={form.frequencia} onChange={set('frequencia')}>
                  <option value="diaria">🔄 Diaria</option>
                  <option value="setmanal">📅 Semanal</option>
                  <option value="mensual">🗓️ Mensual</option>
                  <option value="puntual">📌 Puntual</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Asignar a</label>
                <select className="form-input" value={form.assignat_id} onChange={set('assignat_id')}>
                  <option value="">👥 Sin asignar</option>
                  {membres.map(m => <option key={m.id} value={m.id}>👤 {m.usuaris?.nom}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Crear tarea'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
