import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePis } from '../../context/PisContext'

export default function Miembros() {
  const { pis, membres, rolUsuari, invitar, expulsarMembre, isPremium } = usePis()
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [codiGenerat, setCodiGenerat] = useState(null)

  const premium = isPremium()
  const limite = premium ? Infinity : 4
  const lleno = membres.length >= limite

  async function handleInvitar(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setCodiGenerat(null)

    if (lleno) return setError(`Has alcanzado el límite de ${limite} residentes del plan gratuito.`)

    const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
    if (!regex.test(correo)) return setError('Introduce un correo electrónico válido')
    setLoading(true)
    try {
      const codi = await invitar(correo)
      setCodiGenerat(codi)
      setSuccess(`Invitación generada para ${correo}`)
      setCorreo('')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleExpulsar(membreId, nom) {
    if (!window.confirm(`¿Seguro que quieres expulsar a ${nom}?`)) return
    try { await expulsarMembre(membreId) }
    catch (err) { setError(err.message) }
  }

  const iniciales = nom => nom?.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() || 'U'

  if (!pis) return <div className="page-content"><div className="empty"><p>Primero debes crear o unirte a un piso.</p></div></div>

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">👥 Miembros del piso</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--gray-400)', background: 'var(--gray-100)', padding: '4px 12px', borderRadius: 20, border: 'var(--border)' }}>
            {membres.length}/{premium ? '∞' : 4} residentes
          </span>
          {premium && <span style={{ fontSize: 10, background: 'var(--teal-light)', color: 'var(--teal)', padding: '3px 8px', borderRadius: 10, fontWeight: 700 }}>PRO</span>}
        </div>
      </div>

      <div className="page-content">
        {/* Banner límite */}
        {!premium && lleno && (
          <div className="card animate-in-1" style={{ borderLeft: '4px solid var(--amber)', background: 'var(--amber-light)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--amber)', fontSize: 14 }}>Límite de residentes alcanzado (plan gratuito)</div>
                <div style={{ fontSize: 13, color: 'var(--amber)', opacity: 0.85, marginTop: 2 }}>
                  Con el plan gratuito solo puedes tener 4 residentes. Actualiza a Premium para añadir más.
                </div>
              </div>
              <Link to="/app/planes" className="btn btn-primary" style={{ background: 'var(--amber)', borderColor: 'var(--amber)', whiteSpace: 'nowrap' }}>
                Ver planes →
              </Link>
            </div>
          </div>
        )}

        {!premium && !lleno && (
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 16, padding: '8px 12px', background: 'var(--gray-50)', borderRadius: 8, border: 'var(--border)' }}>
            💡 Plan gratuito: {membres.length} de 4 residentes usados. <Link to="/app/planes" style={{ color: 'var(--purple)', fontWeight: 600 }}>Actualiza a Premium</Link> para pisos sin límite.
          </div>
        )}

        <div className="grid-2">
          {/* Lista residentes */}
          <div className="card animate-in-1">
            <div className="card-title">Residentes actuales ({membres.length})</div>
            {membres.map((m, i) => (
              <div key={m.id} className="row" style={{ animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                <div className="avatar">{iniciales(m.usuaris?.nom)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.usuaris?.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                    {m.usuaris?.correu}
                    {m.creat_a && ` · Desde ${new Date(m.creat_a).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`}
                  </div>
                </div>
                <span className={`badge ${m.rol === 'administrador' ? 'badge-admin' : 'badge-revisio'}`}>
                  {m.rol === 'administrador' ? '⭐ Admin' : 'Residente'}
                </span>
                {rolUsuari === 'administrador' && m.rol !== 'administrador' && (
                  <button
                    className="btn btn-sm"
                    style={{ color: 'var(--coral)', border: 'none', background: 'none' }}
                    onClick={() => handleExpulsar(m.id, m.usuaris?.nom)}
                    title="Expulsar"
                  >✕</button>
                )}
              </div>
            ))}
          </div>

          {/* Invitar */}
          {rolUsuari === 'administrador' && (
            <div className="card animate-in-2">
              <div className="card-title">Invitar residente</div>

              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              {lleno && !premium ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
                  <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 16 }}>Piso lleno. Actualiza a Premium para invitar más residentes.</p>
                  <Link to="/app/planes" className="btn btn-primary" style={{ justifyContent: 'center' }}>Ver planes Premium →</Link>
                </div>
              ) : (
                <form onSubmit={handleInvitar}>
                  <div className="form-group">
                    <label className="form-label">Correo del nuevo residente</label>
                    <input className="form-input" type="email" placeholder="compañero@gmail.com"
                      value={correo} onChange={e => setCorreo(e.target.value)} required />
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                    {loading ? 'Generando...' : '📨 Generar invitación'}
                  </button>
                </form>
              )}

              {/* Código del piso */}
              <div style={{ marginTop: 20, padding: 14, background: 'var(--purple-light)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(83,74,183,0.15)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', marginBottom: 6 }}>🔑 Código de invitación del piso</div>
                <div style={{ fontFamily: 'SF Mono, monospace', fontSize: 20, fontWeight: 800, color: 'var(--purple)', letterSpacing: 4 }}>
                  {codiGenerat || pis.codi_invitacio}
                </div>
                <div style={{ fontSize: 11, color: 'var(--purple)', opacity: 0.7, marginTop: 6 }}>
                  Comparte este código para que tus compañeros se unan directamente
                </div>
                <button
                  className="btn btn-sm"
                  style={{ marginTop: 8, fontSize: 11 }}
                  onClick={() => navigator.clipboard.writeText(codiGenerat || pis.codi_invitacio)}
                >
                  📋 Copiar código
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
