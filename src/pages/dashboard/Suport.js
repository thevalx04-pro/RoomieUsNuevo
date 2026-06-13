import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

const ESTAT_LABEL = { pendent: 'Pendent', en_revisio: 'En revisió', resolta: 'Resolta' }
const ESTAT_BADGE = { pendent: 'badge-pendent', en_revisio: 'badge-revisio', resolta: 'badge-completada' }

export default function Suport() {
  const { user } = useAuth()
  const { pis } = usePis()
  const [incidencies, setIncidencies] = useState([])
  const [modal, setModal] = useState(false)
  const [descripcio, setDescripcio] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (pis) fetchIncidencies() }, [pis])

  async function fetchIncidencies() {
    const { data } = await supabase.from('incidencies')
      .select('*').eq('usuari_id', user.id)
      .order('data_creacio', { ascending: false })
    setIncidencies(data || [])
    setLoading(false)
  }

  async function enviar(e) {
    e.preventDefault()
    if (descripcio.trim().length < 10) return setError('La descripció és massa curta. Afegeix més detalls sobre el problema.')
    setSaving(true); setError('')
    try {
      await supabase.from('incidencies').insert({
        pis_id: pis.id, usuari_id: user.id, descripcio: descripcio.trim()
      })
      setModal(false)
      setDescripcio('')
      fetchIncidencies()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const obertes = incidencies.filter(i => i.estat !== 'resolta').length

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Suport i incidències</span>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Reportar incidència</button>
      </div>
      <div className="page-content">
        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <div className="metric"><div className="metric-label">Obertes</div><div className="metric-val coral">{obertes}</div></div>
          <div className="metric"><div className="metric-label">En revisió</div><div className="metric-val purple">{incidencies.filter(i=>i.estat==='en_revisio').length}</div></div>
          <div className="metric"><div className="metric-label">Resoltes</div><div className="metric-val teal">{incidencies.filter(i=>i.estat==='resolta').length}</div></div>
        </div>

        <div className="card">
          <div className="card-title">Les meves incidències</div>
          {loading && <div className="loading-center" style={{ height: 80 }}><div className="spinner" /></div>}
          {!loading && incidencies.length === 0 && (
            <div className="empty">
              <div className="empty-icon">✅</div>
              <p>Cap incidència reportada. Tot funciona correctament!</p>
            </div>
          )}
          {incidencies.map(inc => (
            <div key={inc.id} className="row" style={{ alignItems: 'flex-start', padding: '10px 0' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{inc.descripcio}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>
                  Creada el {new Date(inc.data_creacio).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long' })}
                </div>
              </div>
              <span className={`badge ${ESTAT_BADGE[inc.estat]}`}>{ESTAT_LABEL[inc.estat]}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <div className="card-title">Informació de suport</div>
          <div style={{ fontSize: 13, color: 'var(--gray-400)', lineHeight: 1.8 }}>
            <p>• Per problemes tècnics de l'app, usa el botó "Reportar incidència"</p>
            <p>• Per problemes de convivència, parla-ho al xat del pis</p>
            <p>• Per urgències al pis (llum, aigua, gas), contacta directament el propietari</p>
            <p>• Temps de resposta habitual: 24–48 hores laborables</p>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-title">Reportar incidència</div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={enviar}>
              <div className="form-group">
                <label className="form-label">Descripció detallada del problema</label>
                <textarea className="form-input" rows={5}
                  placeholder="Descriu detalladament el problema tècnic o incidència..."
                  value={descripcio} onChange={e => setDescripcio(e.target.value)} required />
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                  Mínim 10 caràcters ({descripcio.length} escrits)
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancel·lar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enviant...' : 'Enviar incidència'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
