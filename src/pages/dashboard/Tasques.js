import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

export default function Tasques() {
  const { user } = useAuth()
  const { pis, membres, rolUsuari } = usePis()
  const [tasques, setTasques] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nom: '', descripcio: '', frequencia: 'setmanal', assignat_id: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (pis) fetchTasques() }, [pis])

  async function fetchTasques() {
    const { data } = await supabase
      .from('tasques')
      .select('*, assignacions_tasca(*, membres_pis(*, usuaris(nom)))')
      .eq('pis_id', pis.id)
      .order('data_creacio', { ascending: false })
    setTasques(data || [])
    setLoading(false)
  }

  async function marcarCompletada(tasca) {
    const nouestat = tasca.estat === 'completada' ? 'pendent' : 'completada'
    await supabase.from('tasques').update({ estat: nouestat }).eq('id', tasca.id)
    if (nouestat === 'completada') {
      await supabase.from('assignacions_tasca')
        .update({ data_completada: new Date().toISOString() })
        .eq('tasca_id', tasca.id)
    }
    fetchTasques()
  }

  async function eliminarTasca(id) {
    if (!window.confirm('Segur que vols eliminar aquesta tasca?')) return
    await supabase.from('tasques').delete().eq('id', id)
    fetchTasques()
  }

  async function guardarTasca(e) {
    e.preventDefault()
    if (!form.nom.trim()) return setError('El nom no pot estar buit')
    setSaving(true); setError('')
    try {
      const { data: nova } = await supabase.from('tasques')
        .insert({ pis_id: pis.id, nom: form.nom, descripcio: form.descripcio, frequencia: form.frequencia })
        .select().single()

      if (form.assignat_id) {
        await supabase.from('assignacions_tasca').insert({
          tasca_id: nova.id,
          membre_id: form.assignat_id
        })
      }
      setModal(false)
      setForm({ nom: '', descripcio: '', frequencia: 'setmanal', assignat_id: '' })
      fetchTasques()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const completades = tasques.filter(t => t.estat === 'completada').length
  const pct = tasques.length > 0 ? Math.round(completades / tasques.length * 100) : 0

  if (!pis) return <div className="page-content"><div className="empty"><p>Primer has de crear o unir-te a un pis.</p></div></div>

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Tasques domèstiques</span>
        {rolUsuari === 'administrador' && (
          <button className="btn btn-primary" onClick={() => setModal(true)}>+ Nova tasca</button>
        )}
      </div>
      <div className="page-content">
        <div className="grid-4">
          <div className="metric"><div className="metric-label">Total</div><div className="metric-val purple">{tasques.length}</div></div>
          <div className="metric"><div className="metric-label">Completades</div><div className="metric-val teal">{completades}</div></div>
          <div className="metric"><div className="metric-label">Pendents</div><div className="metric-val coral">{tasques.length - completades}</div></div>
          <div className="metric"><div className="metric-label">% Completat</div><div className="metric-val amber">{pct}%</div></div>
        </div>
        <div className="card">
          <div className="card-title">Progrés del mes</div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
        </div>
        <div className="card" style={{ marginTop: 14 }}>
          <div className="card-title">Totes les tasques</div>
          {loading && <div className="loading-center" style={{ height: 80 }}><div className="spinner" /></div>}
          {!loading && tasques.length === 0 && <div className="empty"><p>Cap tasca creada encara.</p></div>}
          {tasques.map(t => {
            const assignat = t.assignacions_tasca?.[0]?.membres_pis?.usuaris?.nom
            return (
              <div key={t.id} className="row">
                <button className={`task-check ${t.estat === 'completada' ? 'done' : ''}`}
                  onClick={() => marcarCompletada(t)} title="Marcar com a completada">
                  {t.estat === 'completada' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, textDecoration: t.estat === 'completada' ? 'line-through' : 'none', color: t.estat === 'completada' ? 'var(--gray-400)' : 'inherit' }}>{t.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                    {assignat || 'Sense assignar'} · {FREQ_LABEL[t.frequencia]}
                    {t.descripcio && ` · ${t.descripcio}`}
                  </div>
                </div>
                <span className={`badge ${t.estat === 'completada' ? 'badge-completada' : 'badge-pendent'}`}>
                  {t.estat === 'completada' ? 'Completada' : 'Pendent'}
                </span>
                {rolUsuari === 'administrador' && (
                  <button className="btn btn-sm" onClick={() => eliminarTasca(t.id)} title="Eliminar">
                    🗑
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-title">Nova tasca</div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={guardarTasca}>
              <div className="form-group">
                <label className="form-label">Nom de la tasca</label>
                <input className="form-input" placeholder="Ex: Netejar el bany" value={form.nom} onChange={set('nom')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Descripció (opcional)</label>
                <textarea className="form-input" placeholder="Detalls addicionals..." value={form.descripcio} onChange={set('descripcio')} />
              </div>
              <div className="form-group">
                <label className="form-label">Freqüència</label>
                <select className="form-input" value={form.frequencia} onChange={set('frequencia')}>
                  <option value="diaria">Diària</option>
                  <option value="setmanal">Setmanal</option>
                  <option value="mensual">Mensual</option>
                  <option value="puntual">Puntual</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assignar a</label>
                <select className="form-input" value={form.assignat_id} onChange={set('assignat_id')}>
                  <option value="">Sense assignar</option>
                  {membres.map(m => <option key={m.id} value={m.id}>{m.usuaris?.nom}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancel·lar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardant...' : 'Crear tasca'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const FREQ_LABEL = { diaria: 'Diària', setmanal: 'Setmanal', mensual: 'Mensual', puntual: 'Puntual' }
