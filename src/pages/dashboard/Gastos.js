import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

export default function Gastos() {
  const { user } = useAuth()
  const { pis, membres } = usePis()
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ concepte: '', import: '', selectedMembres: [] })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (pis) fetchGastos() }, [pis])

  async function fetchGastos() {
    const { data } = await supabase
      .from('despeses')
      .select('*, participacions_despesa(*, usuaris(nom, id)), usuaris(nom)')
      .eq('pis_id', pis.id)
      .order('creat_a', { ascending: false })
    setGastos(data || [])
    setLoading(false)
  }

  function abrir() {
    setForm({ concepte: '', import: '', selectedMembres: membres.map(m => m.usuaris?.id) })
    setModal(true)
  }

  async function guardar(e) {
    e.preventDefault()
    const imp = parseFloat(form.import)
    if (!form.concepte.trim() || isNaN(imp) || imp <= 0) return setError('Revisa el concepto y el importe')
    if (form.selectedMembres.length === 0) return setError('Selecciona al menos un participante')
    setSaving(true); setError('')
    try {
      const { data: nuevo } = await supabase.from('despeses')
        .insert({ pis_id: pis.id, creador_id: user.id, concepte: form.concepte, import_total: imp })
        .select().single()
      const porPersona = parseFloat((imp / form.selectedMembres.length).toFixed(2))
      await supabase.from('participacions_despesa').insert(
        form.selectedMembres.map(uid => ({
          despesa_id: nuevo.id, usuari_id: uid,
          import: porPersona,
          percentatge: parseFloat((100 / form.selectedMembres.length).toFixed(2)),
          estat_pagament: uid === user.id ? 'pagat' : 'pendent'
        }))
      )
      setModal(false)
      fetchGastos()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function marcarPagado(participacionId) {
    await supabase.from('participacions_despesa').update({ estat_pagament: 'pagat' }).eq('id', participacionId)
    fetchGastos()
  }

  const total = gastos.reduce((a, d) => a + parseFloat(d.import_total), 0)
  const pendiente = gastos.flatMap(d => d.participacions_despesa || []).filter(p => p.estat_pagament === 'pendent').reduce((a, p) => a + parseFloat(p.import), 0)
  const miDeuda = gastos.flatMap(d => d.participacions_despesa || []).filter(p => p.usuari_id === user.id && p.estat_pagament === 'pendent').reduce((a, p) => a + parseFloat(p.import), 0)

  const toggle = uid => setForm(f => ({
    ...f,
    selectedMembres: f.selectedMembres.includes(uid) ? f.selectedMembres.filter(x => x !== uid) : [...f.selectedMembres, uid]
  }))

  if (!pis) return <div className="page-content"><div className="empty"><p>Primero debes crear o unirte a un piso.</p></div></div>

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Gestión económica</span>
        <button className="btn btn-primary" onClick={abrir}>+ Registrar gasto</button>
      </div>
      <div className="page-content">
        <div className="grid-4">
          <div className="metric"><div className="metric-label">Total gastos</div><div className="metric-val purple">{total.toFixed(2)}€</div></div>
          <div className="metric"><div className="metric-label">Pendiente cobro</div><div className="metric-val coral">{pendiente.toFixed(2)}€</div></div>
          <div className="metric"><div className="metric-label">Gastos registrados</div><div className="metric-val teal">{gastos.length}</div></div>
          <div className="metric"><div className="metric-label">Mi deuda</div><div className="metric-val amber">{miDeuda.toFixed(2)}€</div></div>
        </div>

        {loading && <div className="loading-center" style={{ height: 100 }}><div className="spinner" /></div>}
        {!loading && gastos.length === 0 && <div className="card"><div className="empty"><p>Sin gastos registrados todavía.</p></div></div>}

        {gastos.map(d => (
          <div key={d.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{d.concepte}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                  {new Date(d.data).toLocaleDateString('es-ES')} · Pagado por {d.usuaris?.nom}
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{parseFloat(d.import_total).toFixed(2)}€</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Reparto</div>
            {(d.participacions_despesa || []).map(p => (
              <div key={p.id} className="row" style={{ padding: '6px 0' }}>
                <div className="avatar sm">{p.usuaris?.nom?.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()}</div>
                <span style={{ flex: 1, fontSize: 13 }}>{p.usuaris?.nom}</span>
                <span style={{ fontSize: 13 }}>{parseFloat(p.import).toFixed(2)}€</span>
                <span className={`badge ${p.estat_pagament === 'pagat' ? 'badge-pagat' : 'badge-pendent-pag'}`}>
                  {p.estat_pagament === 'pagat' ? 'Pagado' : 'Pendiente'}
                </span>
                {p.usuari_id === user.id && p.estat_pagament === 'pendent' && (
                  <button className="btn btn-sm" onClick={() => marcarPagado(p.id)}>Marcar pagado</button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ width: 400 }}>
            <div className="modal-title">Registrar gasto</div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={guardar}>
              <div className="form-group">
                <label className="form-label">Concepto</label>
                <input className="form-input" placeholder="Ej: Supermercado" value={form.concepte} onChange={e => setForm(f => ({ ...f, concepte: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Importe total (€)</label>
                <input className="form-input" type="number" step="0.01" min="0.01" placeholder="0.00" value={form.import} onChange={e => setForm(f => ({ ...f, import: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Participantes</label>
                {membres.map(m => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.selectedMembres.includes(m.usuaris?.id)} onChange={() => toggle(m.usuaris?.id)} />
                    <span style={{ fontSize: 13 }}>{m.usuaris?.nom}</span>
                    {form.selectedMembres.includes(m.usuaris?.id) && form.import && (
                      <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gray-400)' }}>
                        {(parseFloat(form.import || 0) / form.selectedMembres.length).toFixed(2)}€
                      </span>
                    )}
                  </label>
                ))}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
