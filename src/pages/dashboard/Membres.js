import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

export default function Membres() {
  const { user } = useAuth()
  const { pis, membres, rolUsuari, convidarMembre, refetch } = usePis()
  const [correu, setCorreu] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleConvidar(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!correu.endsWith('@id.uib.eu') && !correu.endsWith('@uib.es')) {
      return setError('Has d\'usar un correu institucional de la UIB (@id.uib.eu)')
    }
    setLoading(true)
    try {
      await convidarMembre(correu)
      setSuccess(`Invitació enviada a ${correu}`)
      setCorreu('')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const inicials = nom => nom?.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() || 'U'

  if (!pis) return <div className="page-content"><div className="empty"><p>Primer has de crear o unir-te a un pis.</p></div></div>

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Membres del pis</span>
        <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{membres.length}/{pis.limit_residents} residents</span>
      </div>
      <div className="page-content">
        <div className="grid-2">
          <div className="card">
            <div className="card-title">Residents actuals</div>
            {membres.map(m => (
              <div key={m.id} className="row">
                <div className="avatar">{inicials(m.usuaris?.nom)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m.usuaris?.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                    {m.usuaris?.correu} · Entrada: {new Date(m.data_entrada).toLocaleDateString('ca-ES')}
                  </div>
                </div>
                <span className={`badge ${m.rol === 'administrador' ? 'badge-admin' : 'badge-pendent'}`}>
                  {m.rol === 'administrador' ? 'Admin' : 'Resident'}
                </span>
              </div>
            ))}
          </div>

          {rolUsuari === 'administrador' && (
            <div className="card">
              <div className="card-title">Convidar nou resident</div>
              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleConvidar}>
                <div className="form-group">
                  <label className="form-label">Correu institucional del nou resident</label>
                  <input className="form-input" type="email" placeholder="alumne@id.uib.eu"
                    value={correu} onChange={e => setCorreu(e.target.value)} required />
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Enviant...' : 'Enviar invitació'}
                </button>
              </form>
              <div style={{ marginTop: 16, padding: 12, background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Codi d'invitació del pis</div>
                <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 600, color: 'var(--purple)', letterSpacing: 2 }}>
                  {pis.codi_invitacio}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                  Comparteix aquest codi perquè qualsevol es pugui unir directament
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
