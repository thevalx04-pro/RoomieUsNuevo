import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

const GASTO_EMOJIS = {
  supermercado: '🛒', mercado: '🛒', mercadona: '🛒',
  luz: '💡', electricidad: '💡', agua: '🚿', gas: '🔥', internet: '📶', wifi: '📶',
  alquiler: '🏠', renta: '🏠', piso: '🏠',
  restaurante: '🍽️', comida: '🍔', cena: '🍷', pizza: '🍕',
  limpieza: '🧹', productos: '🧴',
  default: '💸'
}

function getEmoji(concepto) {
  const c = (concepto || '').toLowerCase()
  for (const [key, emoji] of Object.entries(GASTO_EMOJIS)) {
    if (c.includes(key)) return emoji
  }
  return GASTO_EMOJIS.default
}

export default function Gastos() {
  const { user } = useAuth()
  const { pis, membres } = usePis()
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ concepte: '', import: '', selectedMembres: [] })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandido, setExpandido] = useState(null)

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
  const miPart = gastos.flatMap(d => d.participacions_despesa || []).filter(p => p.usuari_id === user.id).reduce((a, p) => a + parseFloat(p.import), 0)

  const toggle = uid => setForm(f => ({
    ...f,
    selectedMembres: f.selectedMembres.includes(uid) ? f.selectedMembres.filter(x => x !== uid) : [...f.selectedMembres, uid]
  }))

  if (!pis) return <div className="page-content"><div className="empty"><p>Primero debes crear o unirte a un piso.</p></div></div>

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">💰 Gestión económica</span>
        <button className="btn btn-primary" onClick={abrir}>+ Registrar gasto</button>
      </div>
      <div className="page-content">
        {/* Métricas */}
        <div className="grid-4">
          {[
            { label: 'Total gastos', val: total.toFixed(2) + '€', color: 'purple', accent: 'purple-accent', icon: '💸' },
            { label: 'Mi parte', val: miPart.toFixed(2) + '€', color: 'teal', accent: 'teal-accent', icon: '🧾' },
            { label: 'Mi deuda', val: miDeuda.toFixed(2) + '€', color: miDeuda > 0 ? 'coral' : 'teal', accent: miDeuda > 0 ? 'coral-accent' : 'teal-accent', icon: miDeuda > 0 ? '⚠️' : '✅' },
            { label: 'Registros', val: gastos.length, color: 'amber', accent: 'amber-accent', icon: '📊' },
          ].map((m, i) => (
            <div key={m.label} className={`metric ${m.accent} animate-in-${i+1}`}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
              <div className="metric-label">{m.label}</div>
              <div className={`metric-val ${m.color}`}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Mi deuda banner */}
        {miDeuda > 0 && (
          <div className="card animate-in-1" style={{ borderLeft: '4px solid var(--coral)', background: 'var(--coral-light)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--coral)', fontSize: 14 }}>Tienes deudas pendientes: {miDeuda.toFixed(2)}€</div>
                <div style={{ fontSize: 12, color: 'var(--coral)', opacity: 0.8 }}>Revisa los gastos a continuación y marca los que hayas saldado.</div>
              </div>
            </div>
          </div>
        )}

        {loading && <div className="loading-center"><div className="spinner" /></div>}
        {!loading && gastos.length === 0 && (
          <div className="card">
            <div className="empty">
              <div style={{ fontSize: 40, marginBottom: 8 }}>🧾</div>
              <p>Sin gastos registrados todavía.<br/>¡Registra el primero!</p>
            </div>
          </div>
        )}

        {gastos.map((d, i) => {
          const isOpen = expandido === d.id
          const emoji = getEmoji(d.concepte)
          const pendPart = (d.participacions_despesa || []).filter(p => p.estat_pagament === 'pendent').length
          return (
            <div key={d.id} className="gasto-row" style={{ flexDirection: 'column', alignItems: 'stretch', animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setExpandido(isOpen ? null : d.id)}>
                <div className="gasto-icon">{emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{d.concepte}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                    {d.usuaris?.nom} · {new Date(d.creat_a || d.data).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{parseFloat(d.import_total).toFixed(2)}€</div>
                  {pendPart > 0
                    ? <span className="badge badge-pendent-pag">{pendPart} pend.</span>
                    : <span className="badge badge-pagat">Saldado ✓</span>
                  }
                </div>
                <span style={{ color: 'var(--gray-300)', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
              </div>

              {isOpen && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: 'var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Reparto entre participantes</div>
                  {(d.participacions_despesa || []).map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: 'var(--border)' }}>
                      <div className="avatar sm">{p.usuaris?.nom?.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()}</div>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{p.usuaris?.nom}</span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{parseFloat(p.import).toFixed(2)}€</span>
                      <span className={`badge ${p.estat_pagament === 'pagat' ? 'badge-pagat' : 'badge-pendent-pag'}`}>
                        {p.estat_pagament === 'pagat' ? '✓ Pagado' : '⏳ Pendiente'}
                      </span>
                      {p.usuari_id === user.id && p.estat_pagament === 'pendent' && (
                        <button className="btn btn-sm btn-primary" onClick={() => marcarPagado(p.id)}>Marcar pagado</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-title">💸 Registrar nuevo gasto</div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={guardar}>
              <div className="form-group">
                <label className="form-label">Concepto</label>
                <input className="form-input" placeholder="Ej: Supermercado, Luz, Pizza..." value={form.concepte} onChange={e => setForm(f => ({ ...f, concepte: e.target.value }))} required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Importe total (€)</label>
                <input className="form-input" type="number" step="0.01" min="0.01" placeholder="0.00" value={form.import} onChange={e => setForm(f => ({ ...f, import: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Participantes</label>
                <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '4px 0', border: 'var(--border)' }}>
                  {membres.map(m => {
                    const selected = form.selectedMembres.includes(m.usuaris?.id)
                    const parteCalc = form.import && form.selectedMembres.length > 0
                      ? (parseFloat(form.import || 0) / form.selectedMembres.length).toFixed(2)
                      : null
                    return (
                      <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', transition: 'background 0.1s', background: selected ? 'var(--purple-light)' : 'transparent' }}>
                        <input type="checkbox" checked={selected} onChange={() => toggle(m.usuaris?.id)} />
                        <div className="avatar sm">{m.usuaris?.nom?.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()}</div>
                        <span style={{ fontSize: 13, flex: 1, fontWeight: selected ? 600 : 400 }}>{m.usuaris?.nom}</span>
                        {selected && parteCalc && (
                          <span style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 600 }}>{parteCalc}€</span>
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Registrar gasto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
