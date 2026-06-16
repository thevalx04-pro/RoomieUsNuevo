import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Registro() {
  const { registrar } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nom: '', correu: '', contrasenya: '', confirmar: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.contrasenya !== form.confirmar) return setError('Las contraseñas no coinciden')
    if (form.contrasenya.length < 8) return setError('La contraseña debe tener mínimo 8 caracteres')
    setLoading(true)
    try {
      await registrar(form.correu, form.contrasenya, form.nom)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
        <div className="auth-logo">¡Revisa tu correo!</div>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', margin: '10px 0 20px' }}>
          Hemos enviado un enlace de verificación a <strong>{form.correu}</strong>. Haz clic en él para activar tu cuenta.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ width: '100%', justifyContent: 'center' }}>
          Ir a iniciar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">RoomieUs</div>
        <div className="auth-sub">Crea tu cuenta gratis</div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <input className="form-input" placeholder="Ej: María García" value={form.nom} onChange={set('nom')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input className="form-input" type="email" placeholder="tu@correo.com" value={form.correu} onChange={set('correu')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña (mínimo 8 caracteres)</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.contrasenya} onChange={set('contrasenya')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirmar contraseña</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.confirmar} onChange={set('confirmar')} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </button>
        </form>
        <Link to="/login" className="auth-link">¿Ya tienes cuenta? Inicia sesión</Link>
        <Link to="/" className="auth-link" style={{ color: 'var(--gray-400)' }}>← Volver al inicio</Link>
      </div>
    </div>
  )
}
