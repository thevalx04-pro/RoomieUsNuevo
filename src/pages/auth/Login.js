import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { iniciarSessio } = useAuth()
  const navigate = useNavigate()
  const [correu, setCorreu] = useState('')
  const [contrasenya, setContrasenya] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await iniciarSessio(correu, contrasenya)
      navigate('/app')
    } catch (err) {
      setError('Correo o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">RoomieUs</div>
        <div className="auth-sub">Gestión de pisos compartidos</div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo</label>
            <input className="form-input" type="email" placeholder="tu@correo.com"
              value={correu} onChange={e => setCorreu(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={contrasenya} onChange={e => setContrasenya(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
        <Link to="/recuperar-contrasena" className="auth-link" style={{ marginTop: 10 }}>
          He olvidado mi contraseña
        </Link>
        <Link to="/registro" className="auth-link">
          ¿No tienes cuenta? Regístrate gratis
        </Link>
        <Link to="/" className="auth-link" style={{ color: 'var(--gray-400)' }}>
          ← Volver al inicio
        </Link>
      </div>
    </div>
  )
}
