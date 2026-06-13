import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

const TIPUS_COLOR = { visita: 'var(--purple)', festa: 'var(--coral)', recordatori: 'var(--amber)', absencia: 'var(--gray-400)' }
const TIPUS_BADGE = { visita: 'badge-revisio', festa: 'badge-pendent-pag', recordatori: 'badge-pendent', absencia: 'badge-pendent' }
const MESOS = ['Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre']
const DIES = ['Dl','Dm','Dc','Dj','Dv','Ds','Dg']

export default function Calendari() {
  const { user } = useAuth()
  const { pis, rolUsuari } = usePis()
  const [esdeveniments, setEsdeveniments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ titol: '', descripcio: '', data: '', hora: '', tipus: 'visita' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [ara] = useState(new Date())
  const [mes, setMes] = useState(ara.getMonth())
  const [any, setAny] = useState(ara.getFullYear())

  useEffect(() => { if (pis) fetchEsdeveniments() }, [pis, mes, any])

  async function fetchEsdeveniments() {
    const inici = new Date(any, mes, 1).toISOString()
    const fi = new Date(any, mes + 1, 0, 23, 59).toISOString()
    const { data } = await supabase.from('esdeveniments')
      .select('*, usuaris(nom)')
      .eq('pis_id', pis.id)
      .gte('data', inici).lte('data', fi)
      .order('data', { ascending: true })
    setEsdeveniments(data || [])
    setLoading(false)
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.titol.trim() || !form.data) return setError('El títol i la data són obligatoris')
    const dataISOString = new Date(`${form.data}T${form.hora || '00:00'}`).toISOString()
    if (new Date(dataISOString) < new Date()) return setError('La data no pot ser anterior a avui')
    setSaving(true); setError('')
    try {
      await supabase.from('esdeveniments').insert({
        pis_id: pis.id, creador_id: user.id,
        titol: form.titol, descripcio: form.descripcio,
        data: dataISOString, tipus: form.tipus
      })
      setModal(false)
      setForm({ titol: '', descripcio: '', data: '', hora: '', tipus: 'visita' })
      fetchEsdeveniments()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function eliminar(id, creadorId) {
    if (creadorId !== user.id && rolUsuari !== 'administrador') return alert('No tens permisos per eliminar aquest esdeveniment')
    await supabase.from('esdeveniments').delete().eq('id', id)
    fetchEsdeveniments()
  }

  // Construeix la graella del mes
  const primerDia = new Date(any, mes, 1)
  const diesMes = new Date(any, mes + 1, 0).getDate()
  const offsetDia = (primerDia.getDay() + 6) % 7 // Dilluns=0

  const diesAmbEvents = new Set(esdeveniments.map(e => new Date(e.data).getDate()))

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  if (!pis) return <div className="page-content"><div className="empty"><p>Primer has de crear o unir-te a un pis.</p></div></div>

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Calendari compartit</span>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Nou esdeveniment</button>
      </div>
      <div className="page-content">
        <div className="grid-2">
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button className="btn btn-sm" onClick={() => { if (mes === 0) { setMes(11); setAny(a => a - 1) } else setMes(m => m - 1) }}>←</button>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{MESOS[mes]} {any}</span>
              <button className="btn btn-sm" onClick={() => { if (mes === 11) { setMes(0); setAny(a => a + 1) } else setMes(m => m + 1) }}>→</button>
            </div>
            <div className="cal-grid" style={{ marginBottom: 6 }}>
              {DIES.map(d => <div key={d} style={{ fontSize: 11, fontWeight: 500, color: 'var(--gray-400)', textAlign: 'center', padding: '3px 0' }}>{d}</div>)}
            </div>
            <div className="cal-grid">
              {Array(offsetDia).fill(null).map((_, i) => <div key={`e${i}`} />)}
              {Array(diesMes).fill(null).map((_, i) => {
                const dia = i + 1
                const esAvui = dia === ara.getDate() && mes === ara.getMonth() && any === ara.getFullYear()
                const teEvent = diesAmbEvents.has(dia)
                return (
                  <div key={dia} className={`cal-day ${esAvui ? 'today' : ''} ${teEvent ? 'has-event' : ''}`}>
                    {dia}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              {[['visita','Visita'],['festa','Festa'],['recordatori','Recordatori'],['absencia','Absència']].map(([k,l]) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: TIPUS_COLOR[k], display: 'inline-block' }} />{l}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Esdeveniments del mes</div>
            {loading && <div className="loading-center" style={{ height: 80 }}><div className="spinner" /></div>}
            {!loading && esdeveniments.length === 0 && <div className="empty"><p>Cap esdeveniment aquest mes.</p></div>}
            {esdeveniments.map(ev => (
              <div key={ev.id} className="row" style={{ alignItems: 'flex-start', padding: '8px 0' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: TIPUS_COLOR[ev.tipus], flexShrink: 0, marginTop: 4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{ev.titol}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                    {new Date(ev.data).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}
                    {ev.hora ? ` · ${new Date(ev.data).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    {ev.usuaris?.nom ? ` · ${ev.usuaris.nom}` : ''}
                  </div>
                  {ev.descripcio && <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{ev.descripcio}</div>}
                </div>
                <span className={`badge ${TIPUS_BADGE[ev.tipus]}`}>{ev.tipus}</span>
                {(ev.creador_id === user.id || rolUsuari === 'administrador') && (
                  <button className="btn btn-sm" onClick={() => eliminar(ev.id, ev.creador_id)} title="Eliminar">🗑</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-title">Nou esdeveniment</div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={guardar}>
              <div className="form-group">
                <label className="form-label">Títol</label>
                <input className="form-input" placeholder="Ex: Visita família" value={form.titol} onChange={set('titol')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Descripció (opcional)</label>
                <textarea className="form-input" placeholder="Detalls..." value={form.descripcio} onChange={set('descripcio')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Data</label>
                  <input className="form-input" type="date" value={form.data} onChange={set('data')} min={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora (opcional)</label>
                  <input className="form-input" type="time" value={form.hora} onChange={set('hora')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tipus</label>
                <select className="form-input" value={form.tipus} onChange={set('tipus')}>
                  <option value="visita">Visita</option>
                  <option value="festa">Festa</option>
                  <option value="recordatori">Recordatori</option>
                  <option value="absencia">Absència</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancel·lar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardant...' : 'Afegir'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
