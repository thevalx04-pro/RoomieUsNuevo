import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RecuperarContrasenya() {
  const { recuperarContrasenya } = useAuth()
  const [correu, setCorreu] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await recuperarContrasenya(correu)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">RoomieUs</div>
        <div className="auth-sub">Recuperar contrasenya</div>

        {sent ? (
          <div className="alert alert-success">
            Hem enviat un correu a <strong>{correu}</strong> amb les instruccions per restablir la contrasenya.
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Correu institucional</label>
                <input className="form-input" type="email" placeholder="alumne@id.uib.eu"
                  value={correu} onChange={e => setCorreu(e.target.value)} required />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Enviant...' : 'Enviar correu de recuperació'}
              </button>
            </form>
          </>
        )}
        <Link to="/login" className="auth-link">Tornar a iniciar sessió</Link>
      </div>
    </div>
  )
}
