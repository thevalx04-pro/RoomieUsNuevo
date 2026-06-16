import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

const FREQ = { diaria: 'Diaria', setmanal: 'Semanal', mensual: 'Mensual', puntual: 'Puntual' }

export default function Tareas() {
  const { user } = useAuth()
  const { pis, membres, rolUsuari } = usePis()
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nom: '', descripcio: '', frequencia: 'setmanal', assignat_id: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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
    await supabase.from('tasques').update({ estat: nuevoEstado }).eq('id', tarea.id)
    fetchTareas()
  }

  async function eliminarTarea(id) {
    if (!window.confirm('¿Seguro que quieres eliminar esta tarea?')) return
    await supabase.from('tasques').delete().eq('id', id)
    fetchTareas()
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

  if (!pis) return <div className="page-content"><div className="empty"><p>Primero debes crear o unirte a un piso.</p></div></div>

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Tareas del hogar</span>
        {rolUsuari === 'administrador' && (
          <button className="btn btn-primary" onClick={() => setModal(true)}>+ Nueva tarea</button>
        )}
      </div>
      <div className="page-content">
        <div className="grid-4">
          <div className="metric"><div className="metric-label">Total</div><div className="metric-val purple">{tareas.length}</div></div>
          <div className="metric"><div className="metric-label">Completadas</div><div className="metric-val teal">{completadas}</div></div>
          <div className="metric"><div className="metric-label">Pendientes</div><div className="metric-val coral">{tareas.length - completadas}</div></div>
          <div className="metric"><div className="metric-label">% Completado</div><div className="metric-val amber">{pct}%</div></div>
        </div>
        <div className="card">
          <div className="card-title">Progreso del mes</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
        </div>
        <div className="card" style={{ marginTop: 14 }}>
          <div className="card-title">Todas las tareas</div>
          {loading && <div className="loading-center" style={{ height: 80 }}><div className="spinner" /></div>}
          {!loading && tareas.length === 0 && <div className="empty"><p>Sin tareas creadas todavía.</p></div>}
          {tareas.map(t => {
            const asignado = t.assignacions_tasca?.[0]?.membres_pis?.usuaris?.nom
            return (
              <div key={t.id} className="row">
                <button className={`task-check ${t.estat === 'completada' ? 'done' : ''}`} onClick={() => toggleTarea(t)}>
                  {t.estat === 'completada' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, textDecoration: t.estat === 'completada' ? 'line-through' : 'none', color: t.estat === 'completada' ? 'var(--gray-400)' : 'inherit' }}>{t.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{asignado || 'Sin asignar'} · {FREQ[t.frequencia]}</div>
                </div>
                <span className={`badge ${t.estat === 'completada' ? 'badge-completada' : 'badge-pendent'}`}>
                  {t.estat === 'completada' ? 'Hecha' : 'Pendiente'}
                </span>
                {rolUsuari === 'administrador' && (
                  <button className="btn btn-sm" onClick={() => eliminarTarea(t.id)}>🗑</button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-title">Nueva tarea</div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={guardarTarea}>
              <div className="form-group">
                <label className="form-label">Nombre de la tarea</label>
                <input className="form-input" placeholder="Ej: Limpiar el baño" value={form.nom} onChange={set('nom')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción (opcional)</label>
                <textarea className="form-input" placeholder="Detalles adicionales..." value={form.descripcio} onChange={set('descripcio')} />
              </div>
              <div className="form-group">
                <label className="form-label">Frecuencia</label>
                <select className="form-input" value={form.frequencia} onChange={set('frequencia')}>
                  <option value="diaria">Diaria</option>
                  <option value="setmanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                  <option value="puntual">Puntual</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Asignar a</label>
                <select className="form-input" value={form.assignat_id} onChange={set('assignat_id')}>
                  <option value="">Sin asignar</option>
                  {membres.map(m => <option key={m.id} value={m.id}>{m.usuaris?.nom}</option>)}
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
