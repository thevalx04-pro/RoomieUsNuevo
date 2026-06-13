import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

export default function Despeses() {
  const { user } = useAuth()
  const { pis, membres, rolUsuari } = usePis()
  const [despeses, setDespeses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ concepte: '', import: '', selectedMembres: [] })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (pis) fetchDespeses() }, [pis])

  async function fetchDespeses() {
    const { data } = await supabase
      .from('despeses')
      .select('*, participacions_despesa(*, usuaris(nom)), usuaris(nom)')
      .eq('pis_id', pis.id)
      .order('creat_a', { ascending: false })
    setDespeses(data || [])
    setLoading(false)
  }

  function obrir() {
    setForm({ concepte: '', import: '', selectedMembres: membres.map(m => m.usuaris?.id) })
    setModal(true)
  }

  async function guardar(e) {
    e.preventDefault()
    const imp = parseFloat(form.import)
    if (!form.concepte.trim() || isNaN(imp) || imp <= 0) return setError('Revisa el concepte i l\'import')
    if (form.selectedMembres.length === 0) return setError('Selecciona almenys un participant')
    setSaving(true); setError('')
    try {
      const { data: nova } = await supabase.from('despeses')
        .insert({ pis_id: pis.id, creador_id: user.id, concepte: form.concepte, import_total: imp })
        .select().single()

      const perPersona = parseFloat((imp / form.selectedMembres.length).toFixed(2))
      await supabase.from('participacions_despesa').insert(
        form.selectedMembres.map(uid => ({
          despesa_id: nova.id, usuari_id: uid,
          import: perPersona, percentatge: parseFloat((100 / form.selectedMembres.length).toFixed(2)),
          estat_pagament: uid === user.id ? 'pagat' : 'pendent'
        }))
      )
      setModal(false)
      fetchDespeses()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function marcarPagat(participacioId) {
    await supabase.from('participacions_despesa').update({ estat_pagament: 'pagat' }).eq('id', participacioId)
    fetchDespeses()
  }

  const total = despeses.reduce((a, d) => a + parseFloat(d.import_total), 0)
  const pendent = despeses.flatMap(d => d.participacions_despesa || []).filter(p => p.estat_pagament === 'pendent').reduce((a, p) => a + parseFloat(p.import), 0)
  const elMeuDeute = despeses.flatMap(d => d.participacions_despesa || []).filter(p => p.usuari_id === user.id && p.estat_pagament === 'pendent').reduce((a, p) => a + parseFloat(p.import), 0)

  const toggleMembre = uid => setForm(f => ({
    ...f,
    selectedMembres: f.selectedMembres.includes(uid) ? f.selectedMembres.filter(x => x !== uid) : [...f.selectedMembres, uid]
  }))

  if (!pis) return <div className="page-content"><div className="empty"><p>Primer has de crear o unir-te a un pis.</p></div></div>

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Gestió econòmica</span>
        <button className="btn btn-primary" onClick={obrir}>+ Registrar despesa</button>
      </div>
      <div className="page-content">
        <div className="grid-4">
          <div className="metric"><div className="metric-label">Total despeses</div><div className="metric-val purple">{total.toFixed(2)}€</div></div>
          <div className="metric"><div className="metric-label">Pendent cobrament</div><div className="metric-val coral">{pendent.toFixed(2)}€</div></div>
          <div className="metric"><div className="metric-label">Despeses registrades</div><div className="metric-val teal">{despeses.length}</div></div>
          <div className="metric"><div className="metric-label">El meu deute</div><div className="metric-val amber">{elMeuDeute.toFixed(2)}€</div></div>
        </div>

        {loading && <div className="loading-center" style={{ height: 100 }}><div className="spinner" /></div>}
        {!loading && despeses.length === 0 && <div className="card"><div className="empty"><p>Cap despesa registrada encara.</p></div></div>}

        {despeses.map(d => (
          <div key={d.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{d.concepte}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                  {new Date(d.data).toLocaleDateString('ca-ES')} · Pagat per {d.usuaris?.nom}
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{parseFloat(d.import_total).toFixed(2)}€</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Repartiment</div>
            {(d.participacions_despesa || []).map(p => (
              <div key={p.id} className="row" style={{ padding: '6px 0' }}>
                <div className="avatar sm">{p.usuaris?.nom?.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()}</div>
                <span style={{ flex: 1, fontSize: 13 }}>{p.usuaris?.nom}</span>
                <span style={{ fontSize: 13 }}>{parseFloat(p.import).toFixed(2)}€</span>
                <span className={`badge ${p.estat_pagament === 'pagat' ? 'badge-pagat' : 'badge-pendent-pag'}`}>
                  {p.estat_pagament === 'pagat' ? 'Pagat' : 'Pendent'}
                </span>
                {p.usuari_id === user.id && p.estat_pagament === 'pendent' && (
                  <button className="btn btn-sm" onClick={() => marcarPagat(p.id)}>Marcar pagat</button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ width: 400 }}>
            <div className="modal-title">Registrar despesa</div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={guardar}>
              <div className="form-group">
                <label className="form-label">Concepte</label>
                <input className="form-input" placeholder="Ex: Supermercado" value={form.concepte} onChange={e => setForm(f => ({ ...f, concepte: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Import total (€)</label>
                <input className="form-input" type="number" step="0.01" min="0.01" placeholder="0.00" value={form.import} onChange={e => setForm(f => ({ ...f, import: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Participants</label>
                {membres.map(m => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.selectedMembres.includes(m.usuaris?.id)}
                      onChange={() => toggleMembre(m.usuaris?.id)} />
                    <span style={{ fontSize: 13 }}>{m.usuaris?.nom}</span>
                    {form.selectedMembres.length > 0 && form.selectedMembres.includes(m.usuaris?.id) && form.import && (
                      <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gray-400)' }}>
                        {(parseFloat(form.import || 0) / form.selectedMembres.length).toFixed(2)}€
                      </span>
                    )}
                  </label>
                ))}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancel·lar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardant...' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
