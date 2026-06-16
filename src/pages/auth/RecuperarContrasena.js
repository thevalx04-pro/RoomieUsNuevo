import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RecuperarContrasena() {
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
        <div className="auth-sub">Recuperar contraseña</div>
        {sent ? (
          <div className="alert alert-success">
            Hemos enviado las instrucciones a <strong>{correu}</strong>. Revisa tu bandeja de entrada.
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Tu correo electrónico</label>
                <input className="form-input" type="email" placeholder="tu@correo.com"
                  value={correu} onChange={e => setCorreu(e.target.value)} required />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Enviando...' : 'Enviar instrucciones'}
              </button>
            </form>
          </>
        )}
        <Link to="/login" className="auth-link">Volver a iniciar sesión</Link>
      </div>
    </div>
  )
}
