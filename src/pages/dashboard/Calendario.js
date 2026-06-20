import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

const COLOR = { visita: 'var(--purple)', festa: 'var(--coral)', recordatori: 'var(--amber)', absencia: 'var(--gray-400)' }
const BADGE = { visita: 'badge-revisio', festa: 'badge-pendent-pag', recordatori: 'badge-pendent', absencia: 'badge-pendent' }
const TIPO_LABEL = { visita: 'Visita', festa: 'Fiesta', recordatori: 'Recordatorio', absencia: 'Ausencia' }
const TIPO_EMOJI = { visita: '👋', festa: '🎉', recordatori: '🔔', absencia: '✈️' }
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
  const [selDia, setSelDia] = useState(null)

  useEffect(() => { if (pis) fetchEventos() }, [pis, mes, anio])

  async function fetchEventos() {
    setLoading(true)
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
    const dataISO = new Date(`${form.data}T${form.hora || '00:00'}`).toISOString()
    if (new Date(dataISO) < new Date()) return setError('La fecha no puede ser anterior a hoy')
    setSaving(true); setError('')
    try {
      await supabase.from('esdeveniments').insert({
        pis_id: pis.id, creador_id: user.id,
        titol: form.titol, descripcio: form.descripcio,
        data: dataISO, tipus: form.tipus
      })
      setModal(false)
      setForm({ titol: '', descripcio: '', data: '', hora: '', tipus: 'visita' })
      fetchEventos()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function eliminar(id, creadorId) {
    if (creadorId !== user.id && rolUsuari !== 'administrador') return alert('No tienes permisos para eliminar este evento')
    setEventos(prev => prev.filter(e => e.id !== id))
    await supabase.from('esdeveniments').delete().eq('id', id)
  }

  const primerDia = new Date(anio, mes, 1)
  const diasMes = new Date(anio, mes + 1, 0).getDate()
  const offsetDia = (primerDia.getDay() + 6) % 7

  // Map dia -> eventos
  const eventosPorDia = {}
  eventos.forEach(ev => {
    const d = new Date(ev.data).getDate()
    if (!eventosPorDia[d]) eventosPorDia[d] = []
    eventosPorDia[d].push(ev)
  })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const eventosDia = selDia ? (eventosPorDia[selDia] || []) : eventos

  function navMes(dir) {
    setSelDia(null)
    if (dir === -1) { if (mes === 0) { setMes(11); setAnio(a => a - 1) } else setMes(m => m - 1) }
    else { if (mes === 11) { setMes(0); setAnio(a => a + 1) } else setMes(m => m + 1) }
  }

  if (!pis) return <div className="page-content"><div className="empty"><p>Primero debes crear o unirte a un piso.</p></div></div>

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">📅 Calendario compartido</span>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Nuevo evento</button>
      </div>

      <div className="page-content">
        <div className="grid-2">
          {/* Calendario */}
          <div className="card animate-in-1">
            {/* Navegación mes */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button className="btn btn-sm" onClick={() => navMes(-1)}>←</button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{MESES[mes]}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{anio}</div>
              </div>
              <button className="btn btn-sm" onClick={() => navMes(1)}>→</button>
            </div>

            {/* Cabecera días */}
            <div className="cal-grid" style={{ marginBottom: 4 }}>
              {DIAS.map(d => (
                <div key={d} style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textAlign: 'center', padding: '3px 0' }}>{d}</div>
              ))}
            </div>

            {/* Días */}
            <div className="cal-grid">
              {Array(offsetDia).fill(null).map((_, i) => <div key={`e${i}`} />)}
              {Array(diasMes).fill(null).map((_, i) => {
                const dia = i + 1
                const esHoy = dia === ahora.getDate() && mes === ahora.getMonth() && anio === ahora.getFullYear()
                const evsDia = eventosPorDia[dia] || []
                const esSel = selDia === dia
                return (
                  <div
                    key={dia}
                    onClick={() => setSelDia(esSel ? null : dia)}
                    style={{
                      padding: '5px 2px', textAlign: 'center', fontSize: 12,
                      borderRadius: 8, cursor: evsDia.length > 0 || true ? 'pointer' : 'default',
                      background: esSel ? 'var(--purple)' : esHoy ? 'var(--purple-light)' : 'transparent',
                      color: esSel ? '#fff' : esHoy ? 'var(--purple)' : 'inherit',
                      fontWeight: esHoy || esSel ? 700 : 400,
                      transition: 'all 0.1s',
                      position: 'relative',
                    }}
                  >
                    {dia}
                    {evsDia.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2 }}>
                        {evsDia.slice(0, 3).map((ev, j) => (
                          <span key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: esSel ? 'rgba(255,255,255,0.7)' : COLOR[ev.tipus], display: 'inline-block' }} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Leyenda */}
            <div style={{ display: 'flex', gap: 14, marginTop: 16, flexWrap: 'wrap', paddingTop: 12, borderTop: 'var(--border)' }}>
              {Object.entries(TIPO_LABEL).map(([k, l]) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR[k], display: 'inline-block' }} />
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* Lista eventos */}
          <div className="card animate-in-2">
            <div className="card-title">
              {selDia
                ? <>📍 {dia => dia} {MESES[mes].toLowerCase()} <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => setSelDia(null)}>Ver todos</button></>
                : `📋 Eventos de ${MESES[mes]}`
              }
              {selDia && (
                <div style={{ fontWeight: 400, fontSize: 13 }}>
                  {selDia} de {MESES[mes]}
                  <button className="btn btn-sm" style={{ marginLeft: 8, fontSize: 11 }} onClick={() => setSelDia(null)}>Ver todos</button>
                </div>
              )}
            </div>

            {loading && <div className="loading-center" style={{ height: 80 }}><div className="spinner" /></div>}
            {!loading && eventosDia.length === 0 && (
              <div className="empty" style={{ padding: '24px 0' }}>
                <div style={{ fontSize: 32 }}>📅</div>
                <p>{selDia ? `Sin eventos el día ${selDia}` : 'Sin eventos este mes'}</p>
              </div>
            )}

            {eventosDia.map((ev, i) => (
              <div key={ev.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 0', borderBottom: 'var(--border)',
                animation: `fadeIn 0.25s ease ${i * 0.05}s both`
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: COLOR[ev.tipus] + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18
                }}>
                  {TIPO_EMOJI[ev.tipus]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.titol}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                    {new Date(ev.data).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    {' · '}
                    {new Date(ev.data).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    {ev.usuaris?.nom && ` · ${ev.usuaris.nom}`}
                  </div>
                  {ev.descripcio && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 3, lineHeight: 1.4 }}>{ev.descripcio}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span className={`badge ${BADGE[ev.tipus]}`}>{TIPO_LABEL[ev.tipus]}</span>
                  {(ev.creador_id === user.id || rolUsuari === 'administrador') && (
                    <button className="btn btn-sm" style={{ color: 'var(--coral)', border: 'none', background: 'none', padding: '2px 4px' }} onClick={() => eliminar(ev.id, ev.creador_id)}>🗑</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-title">📅 Nuevo evento</div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={guardar}>
              <div className="form-group">
                <label className="form-label">Título</label>
                <input className="form-input" placeholder="Ej: Visita de la familia" value={form.titol} onChange={set('titol')} required autoFocus />
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
                <label className="form-label">Tipo de evento</label>
                <select className="form-input" value={form.tipus} onChange={set('tipus')}>
                  <option value="visita">👋 Visita</option>
                  <option value="festa">🎉 Fiesta</option>
                  <option value="recordatori">🔔 Recordatorio</option>
                  <option value="absencia">✈️ Ausencia</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Añadir evento'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
