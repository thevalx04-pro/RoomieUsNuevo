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
      navigate('/')
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
        <div className="auth-sub">Gestió de pisos compartits per a estudiants de la UIB</div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correu institucional</label>
            <input className="form-input" type="email" placeholder="alumne@id.uib.eu"
              value={correu} onChange={e => setCorreu(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Contrasenya</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={contrasenya} onChange={e => setContrasenya(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Iniciant sessió...' : 'Iniciar sessió'}
          </button>
        </form>

        <Link to="/recuperar-contrasenya" className="auth-link" style={{ marginTop: 10 }}>
          He oblidat la contrasenya
        </Link>
        <Link to="/registre" className="auth-link">
          No tens compte? Registra't
        </Link>
      </div>
    </div>
  )
}
