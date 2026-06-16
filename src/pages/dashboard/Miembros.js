import { useState } from 'react'
import { usePis } from '../../context/PisContext'

export default function Miembros() {
  const { pis, membres, rolUsuari, convidarMembre } = usePis()
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleInvitar(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
    if (!regex.test(correo)) return setError('Introduce un correo electrónico válido')
    setLoading(true)
    try {
      await convidarMembre(correo)
      setSuccess(`Invitación enviada a ${correo}`)
      setCorreo('')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const iniciales = nom => nom?.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() || 'U'

  if (!pis) return <div className="page-content"><div className="empty"><p>Primero debes crear o unirte a un piso.</p></div></div>

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Miembros del piso</span>
        <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{membres.length}/{pis.limit_residents} residentes</span>
      </div>
      <div className="page-content">
        <div className="grid-2">
          <div className="card">
            <div className="card-title">Residentes actuales</div>
            {membres.map(m => (
              <div key={m.id} className="row">
                <div className="avatar">{iniciales(m.usuaris?.nom)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m.usuaris?.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                    {m.usuaris?.correu} · Desde {new Date(m.data_entrada).toLocaleDateString('es-ES')}
                  </div>
                </div>
                <span className={`badge ${m.rol === 'administrador' ? 'badge-admin' : 'badge-pendent'}`}>
                  {m.rol === 'administrador' ? 'Admin' : 'Residente'}
                </span>
              </div>
            ))}
          </div>

          {rolUsuari === 'administrador' && (
            <div className="card">
              <div className="card-title">Invitar nuevo residente</div>
              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleInvitar}>
                <div className="form-group">
                  <label className="form-label">Correo del nuevo residente</label>
                  <input className="form-input" type="email" placeholder="compañero@gmail.com"
                    value={correo} onChange={e => setCorreo(e.target.value)} required />
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Enviando...' : 'Enviar invitación'}
                </button>
              </form>
              <div style={{ marginTop: 16, padding: 12, background: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Código de invitación del piso</div>
                <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: 'var(--purple)', letterSpacing: 3 }}>
                  {pis.codi_invitacio}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                  Comparte este código para que cualquiera pueda unirse directamente
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
