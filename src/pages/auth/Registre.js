import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Registre() {
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
    if (form.contrasenya !== form.confirmar) return setError('Les contrasenyes no coincideixen')
    if (form.contrasenya.length < 8) return setError('La contrasenya ha de tenir mínim 8 caràcters')
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
        <div className="auth-logo">Comprova el correu</div>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', margin: '10px 0 20px' }}>
          Hem enviat un correu de verificació a <strong>{form.correu}</strong>. Fes clic a l'enllaç per activar el compte.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ width: '100%', justifyContent: 'center' }}>
          Anar a iniciar sessió
        </button>
      </div>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">RoomieUs</div>
        <div className="auth-sub">Crea el teu compte amb el correu de la UIB</div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nom complet</label>
            <input className="form-input" placeholder="Ex: Maria García" value={form.nom} onChange={set('nom')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Correu institucional (@id.uib.eu)</label>
            <input className="form-input" type="email" placeholder="alumne@id.uib.eu" value={form.correu} onChange={set('correu')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Contrasenya (mínim 8 caràcters)</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.contrasenya} onChange={set('contrasenya')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirmar contrasenya</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.confirmar} onChange={set('confirmar')} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Registrant...' : 'Crear compte'}
          </button>
        </form>

        <Link to="/login" className="auth-link">Ja tens compte? Inicia sessió</Link>
      </div>
    </div>
  )
}
