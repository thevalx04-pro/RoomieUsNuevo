import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

export default function Inici() {
  const { perfil } = useAuth()
  const { pis, membres, crearPis, acceptarInvitacio } = usePis()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pendents: 0, completades: 0, despesaTotal: 0, pendentPag: 0 })
  const [propers, setPropers] = useState([])
  const [formPis, setFormPis] = useState({ nom: '', limit: 4, normes: '' })
  const [codiInvit, setCodiInvit] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!pis) return
    fetchStats()
    fetchEsdeveniments()
  }, [pis])

  async function fetchStats() {
    const [tasques, despeses, parts] = await Promise.all([
      supabase.from('tasques').select('estat').eq('pis_id', pis.id),
      supabase.from('despeses').select('import_total').eq('pis_id', pis.id),
      supabase.from('participacions_despesa').select('import, estat_pagament').eq('estat_pagament', 'pendent')
    ])
    const t = tasques.data || []
    const d = despeses.data || []
    const p = parts.data || []
    setStats({
      pendents: t.filter(x => x.estat === 'pendent').length,
      completades: t.filter(x => x.estat === 'completada').length,
      despesaTotal: d.reduce((a, x) => a + parseFloat(x.import_total), 0),
      pendentPag: p.reduce((a, x) => a + parseFloat(x.import), 0)
    })
  }

  async function fetchEsdeveniments() {
    const { data } = await supabase.from('esdeveniments')
      .select('*').eq('pis_id', pis.id)
      .gte('data', new Date().toISOString())
      .order('data', { ascending: true }).limit(4)
    setPropers(data || [])
  }

  async function handleCrearPis(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await crearPis(formPis.nom, parseInt(formPis.limit), formPis.normes)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleAcceptarInvit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try { await acceptarInvitacio(codiInvit) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  // Usuari sense pis
  if (!pis) return (
    <div>
      <div className="topbar"><span className="topbar-title">Benvingut, {perfil?.nom?.split(' ')[0]}!</span></div>
      <div className="page-content" style={{ maxWidth: 500, margin: '0 auto' }}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="card">
          <div className="card-title">Crear un pis nou</div>
          <form onSubmit={handleCrearPis}>
            <div className="form-group">
              <label className="form-label">Nom del pis</label>
              <input className="form-input" placeholder="Ex: Pis Carrer Aragon" value={formPis.nom}
                onChange={e => setFormPis(f => ({ ...f, nom: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Límit de residents</label>
              <input className="form-input" type="number" min="2" max="10" value={formPis.limit}
                onChange={e => setFormPis(f => ({ ...f, limit: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Normes internes (opcional)</label>
              <textarea className="form-input" placeholder="Ex: No fumar, silenci a les 23h..."
                value={formPis.normes} onChange={e => setFormPis(f => ({ ...f, normes: e.target.value }))} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Creant...' : 'Crear pis'}
            </button>
          </form>
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">Unir-me a un pis existent</div>
          <form onSubmit={handleAcceptarInvit}>
            <div className="form-group">
              <label className="form-label">Codi d'invitació</label>
              <input className="form-input" placeholder="Ex: a3f7b2c1" value={codiInvit}
                onChange={e => setCodiInvit(e.target.value)} required />
            </div>
            <button className="btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Unint...' : 'Unir-me al pis'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  const total = stats.pendents + stats.completades
  const pct = total > 0 ? Math.round(stats.completades / total * 100) : 0

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Bon dia, {perfil?.nom?.split(' ')[0]}!</span>
        <div className="topbar-actions">
          <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{membres.length} residents · {pis.nom}</span>
        </div>
      </div>
      <div className="page-content">
        <div className="grid-4">
          <div className="metric"><div className="metric-label">Tasques pendents</div><div className="metric-val coral">{stats.pendents}</div></div>
          <div className="metric"><div className="metric-label">Tasques fetes</div><div className="metric-val teal">{stats.completades}</div></div>
          <div className="metric"><div className="metric-label">Despeses (mes)</div><div className="metric-val purple">{stats.despesaTotal.toFixed(2)}€</div></div>
          <div className="metric"><div className="metric-label">Pendent cobrament</div><div className="metric-val amber">{stats.pendentPag.toFixed(2)}€</div></div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-title">Progrés de tasques
              <Link to="/tasques" style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 400 }}>Veure totes →</Link>
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 6 }}>{stats.completades} de {total} completades ({pct}%)</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
          </div>
          <div className="card">
            <div className="card-title">Propers esdeveniments
              <Link to="/calendari" style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 400 }}>Veure tots →</Link>
            </div>
            {propers.length === 0 && <div className="empty"><p>Cap esdeveniment proper</p></div>}
            {propers.map(ev => (
              <div key={ev.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', borderBottom: 'var(--border)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: ev.tipus === 'festa' ? 'var(--coral)' : ev.tipus === 'recordatori' ? 'var(--amber)' : 'var(--purple)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13 }}>{ev.titol}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{new Date(ev.data).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Membres del pis</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {membres.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--gray-100)', borderRadius: 'var(--radius-md)', padding: '6px 10px' }}>
                <div className="avatar sm">{m.usuaris?.nom?.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{m.usuaris?.nom}</div>
                  <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{m.rol}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
