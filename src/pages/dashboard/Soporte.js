import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

const ESTADO = { pendent: 'Pendiente', en_revisio: 'En revisión', resolta: 'Resuelta' }
const BADGE = { pendent: 'badge-pendent', en_revisio: 'badge-revisio', resolta: 'badge-completada' }

export default function Soporte() {
  const { user } = useAuth()
  const { pis } = usePis()
  const [incidencias, setIncidencias] = useState([])
  const [modal, setModal] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (pis) fetchIncidencias() }, [pis])

  async function fetchIncidencias() {
    const { data } = await supabase.from('incidencies')
      .select('*').eq('usuari_id', user.id)
      .order('data_creacio', { ascending: false })
    setIncidencias(data || [])
    setLoading(false)
  }

  async function enviar(e) {
    e.preventDefault()
    if (descripcion.trim().length < 10) return setError('La descripción es demasiado corta. Añade más detalles.')
    setSaving(true); setError('')
    try {
      await supabase.from('incidencies').insert({
        pis_id: pis.id, usuari_id: user.id, descripcio: descripcion.trim()
      })
      setModal(false)
      setDescripcion('')
      fetchIncidencias()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const abiertas = incidencias.filter(i => i.estat !== 'resolta').length

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Soporte e incidencias</span>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Reportar incidencia</button>
      </div>
      <div className="page-content">
        <div className="grid-4" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <div className="metric"><div className="metric-label">Abiertas</div><div className="metric-val coral">{abiertas}</div></div>
          <div className="metric"><div className="metric-label">En revisión</div><div className="metric-val purple">{incidencias.filter(i => i.estat === 'en_revisio').length}</div></div>
          <div className="metric"><div className="metric-label">Resueltas</div><div className="metric-val teal">{incidencias.filter(i => i.estat === 'resolta').length}</div></div>
        </div>
        <div className="card">
          <div className="card-title">Mis incidencias</div>
          {loading && <div className="loading-center" style={{ height: 80 }}><div className="spinner" /></div>}
          {!loading && incidencias.length === 0 && (
            <div className="empty">
              <div className="empty-icon">✅</div>
              <p>Sin incidencias reportadas. ¡Todo funciona correctamente!</p>
            </div>
          )}
          {incidencias.map(inc => (
            <div key={inc.id} className="row" style={{ alignItems: 'flex-start', padding: '10px 0' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{inc.descripcio}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>
                  Creada el {new Date(inc.data_creacio).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                </div>
              </div>
              <span className={`badge ${BADGE[inc.estat]}`}>{ESTADO[inc.estat]}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginTop: 14 }}>
          <div className="card-title">Información de soporte</div>
          <div style={{ fontSize: 13, color: 'var(--gray-400)', lineHeight: 1.8 }}>
            <p>• Para problemas técnicos de la app, usa el botón "Reportar incidencia"</p>
            <p>• Para problemas de convivencia, habladlo en el chat del piso</p>
            <p>• Para urgencias en el piso (luz, agua, gas), contacta directamente con el propietario</p>
            <p>• Tiempo de respuesta habitual: 24–48 horas laborables</p>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-title">Reportar incidencia</div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={enviar}>
              <div className="form-group">
                <label className="form-label">Descripción detallada del problema</label>
                <textarea className="form-input" rows={5}
                  placeholder="Describe detalladamente el problema técnico o incidencia..."
                  value={descripcion} onChange={e => setDescripcion(e.target.value)} required />
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                  Mínimo 10 caracteres ({descripcion.length} escritos)
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enviando...' : 'Enviar incidencia'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
