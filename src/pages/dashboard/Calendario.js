import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

const COLOR = { visita: 'var(--purple)', festa: 'var(--coral)', recordatori: 'var(--amber)', absencia: 'var(--gray-400)' }
const BADGE = { visita: 'badge-revisio', festa: 'badge-pendent-pag', recordatori: 'badge-pendent', absencia: 'badge-pendent' }
const TIPO_LABEL = { visita: 'Visita', festa: 'Fiesta', recordatori: 'Recordatorio', absencia: 'Ausencia' }
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS = ['Lu','Ma','Mi','Ju','Vi','Sa','Do']

export default function Calendario() {
  const { user } = useAuth()
  const { pis, rolUsuari } = usePis()
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ titol: '', descripcio: '', data: '', hora: '', tipus: 'visita' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [ahora] = useState(new Date())
  const [mes, setMes] = useState(ahora.getMonth())
  const [anio, setAnio] = useState(ahora.getFullYear())

  useEffect(() => { if (pis) fetchEventos() }, [pis, mes, anio])

  async function fetchEventos() {
    const inicio = new Date(anio, mes, 1).toISOString()
    const fin = new Date(anio, mes + 1, 0, 23, 59).toISOString()
    const { data } = await supabase.from('esdeveniments')
      .select('*, usuaris(nom)')
      .eq('pis_id', pis.id)
      .gte('data', inicio).lte('data', fin)
      .order('data', { ascending: true })
    setEventos(data || [])
    setLoading(false)
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.titol.trim() || !form.data) return setError('El título y la fecha son obligatorios')
    const dataISOString = new Date(`${form.data}T${form.hora || '00:00'}`).toISOString()
    if (new Date(dataISOString) < new Date()) return setError('La fecha no puede ser anterior a hoy')
    setSaving(true); setError('')
    try {
      await supabase.from('esdeveniments').insert({
        pis_id: pis.id, creador_id: user.id,
        titol: form.titol, descripcio: form.descripcio,
        data: dataISOString, tipus: form.tipus
      })
      setModal(false)
      setForm({ titol: '', descripcio: '', data: '', hora: '', tipus: 'visita' })
      fetchEventos()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function eliminar(id, creadorId) {
    if (creadorId !== user.id && rolUsuari !== 'administrador') return alert('No tienes permisos para eliminar este evento')
    await supabase.from('esdeveniments').delete().eq('id', id)
    fetchEventos()
  }

  const primerDia = new Date(anio, mes, 1)
  const diasMes = new Date(anio, mes + 1, 0).getDate()
  const offsetDia = (primerDia.getDay() + 6) % 7

  const diasConEventos = new Set(eventos.map(e => new Date(e.data).getDate()))
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  if (!pis) return <div className="page-content"><div className="empty"><p>Primero debes crear o unirte a un piso.</p></div></div>

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Calendario compartido</span>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Nuevo evento</button>
      </div>
      <div className="page-content">
        <div className="grid-2">
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button className="btn btn-sm" onClick={() => { if (mes === 0) { setMes(11); setAnio(a => a - 1) } else setMes(m => m - 1) }}>←</button>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{MESES[mes]} {anio}</span>
              <button className="btn btn-sm" onClick={() => { if (mes === 11) { setMes(0); setAnio(a => a + 1) } else setMes(m => m + 1) }}>→</button>
            </div>
            <div className="cal-grid" style={{ marginBottom: 6 }}>
              {DIAS.map(d => <div key={d} style={{ fontSize: 11, fontWeight: 500, color: 'var(--gray-400)', textAlign: 'center', padding: '3px 0' }}>{d}</div>)}
            </div>
            <div className="cal-grid">
              {Array(offsetDia).fill(null).map((_, i) => <div key={`e${i}`} />)}
              {Array(diasMes).fill(null).map((_, i) => {
                const dia = i + 1
                const esHoy = dia === ahora.getDate() && mes === ahora.getMonth() && anio === ahora.getFullYear()
                const tieneEvento = diasConEventos.has(dia)
                return (
                  <div key={dia} className={`cal-day ${esHoy ? 'today' : ''} ${tieneEvento ? 'has-event' : ''}`}>{dia}</div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              {Object.entries(TIPO_LABEL).map(([k, l]) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR[k], display: 'inline-block' }} />{l}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Eventos del mes</div>
            {loading && <div className="loading-center" style={{ height: 80 }}><div className="spinner" /></div>}
            {!loading && eventos.length === 0 && <div className="empty"><p>Sin eventos este mes.</p></div>}
            {eventos.map(ev => (
              <div key={ev.id} className="row" style={{ alignItems: 'flex-start', padding: '8px 0' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLOR[ev.tipus], flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{ev.titol}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                    {new Date(ev.data).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    {ev.hora ? ` · ${new Date(ev.data).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    {ev.usuaris?.nom ? ` · ${ev.usuaris.nom}` : ''}
                  </div>
                  {ev.descripcio && <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{ev.descripcio}</div>}
                </div>
                <span className={`badge ${BADGE[ev.tipus]}`}>{TIPO_LABEL[ev.tipus]}</span>
                {(ev.creador_id === user.id || rolUsuari === 'administrador') && (
                  <button className="btn btn-sm" onClick={() => eliminar(ev.id, ev.creador_id)}>🗑</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-title">Nuevo evento</div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={guardar}>
              <div className="form-group">
                <label className="form-label">Título</label>
                <input className="form-input" placeholder="Ej: Visita familia" value={form.titol} onChange={set('titol')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción (opcional)</label>
                <textarea className="form-input" placeholder="Detalles..." value={form.descripcio} onChange={set('descripcio')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input className="form-input" type="date" value={form.data} onChange={set('data')} min={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora (opcional)</label>
                  <input className="form-input" type="time" value={form.hora} onChange={set('hora')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-input" value={form.tipus} onChange={set('tipus')}>
                  <option value="visita">Visita</option>
                  <option value="festa">Fiesta</option>
                  <option value="recordatori">Recordatorio</option>
                  <option value="absencia">Ausencia</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Añadir'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
