import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

const PLANES = [
  {
    id: 'free',
    nombre: 'Gratis',
    precio: 0,
    periodo: 'para siempre',
    icon: '🏠',
    color: 'var(--gray-400)',
    features: ['1 piso, hasta 4 compañeros', 'Tareas y calendario', 'Chat del piso', 'Gastos básicos'],
    limitado: true,
  },
  {
    id: 'monthly',
    nombre: 'Premium Mensual',
    precio: 5.99,
    precioTotal: 5.99,
    periodo: 'por mes',
    icon: '⭐',
    color: 'var(--purple)',
    duracionMeses: 1,
    features: ['Pisos y compañeros ilimitados', 'Sin límite de residentes', 'Historial completo', 'Soporte prioritario'],
    destacado: false,
  },
  {
    id: 'annual',
    nombre: 'Premium Anual',
    precio: 4.99, // precio por mes equivalente
    precioTotal: 59.99,
    periodo: '/ año',
    icon: '🏆',
    color: 'var(--teal)',
    duracionMeses: 12,
    features: ['Todo lo del plan mensual', 'Ahorro de 11,89€/año', 'Prioridad máxima soporte', 'Próximas funciones antes'],
    destacado: true,
    ahorro: '11,89€',
  },
]

export default function Planes() {
  const { user } = useAuth()
  const { pis, subscripcio, isPremium, rolUsuari, refreshSubscripcio } = usePis()
  const [activando, setActivando] = useState(null)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState('')

  const premium = isPremium()
  const dataFin = subscripcio?.data_fi ? new Date(subscripcio.data_fi) : null
  const diasRestantes = dataFin ? Math.max(0, Math.ceil((dataFin - new Date()) / (1000 * 60 * 60 * 24))) : 0

  async function activarPlan(plan) {
    if (plan.id === 'free') return
    if (rolUsuari !== 'administrador') return setError('Solo el administrador del piso puede gestionar el plan.')
    if (!pis) return setError('Primero debes crear o unirte a un piso.')

    setActivando(plan.id)
    setError('')

    try {
      // Cancelar suscripción activa anterior si existe
      await supabase
        .from('subscripcions')
        .update({ estat: 'cancelada' })
        .eq('pis_id', pis.id)
        .eq('estat', 'activa')

      // Calcular fecha de fin
      const ara = new Date()
      const dataFi = new Date(ara)
      dataFi.setMonth(dataFi.getMonth() + plan.duracionMeses)

      // Crear nueva suscripción
      await supabase.from('subscripcions').insert({
        pis_id: pis.id,
        activada_per: user.id,
        pla: plan.id,
        import: plan.precioTotal,
        data_inici: ara.toISOString(),
        data_fi: dataFi.toISOString(),
        estat: 'activa',
      })

      await refreshSubscripcio()
      setExito(true)
      setTimeout(() => setExito(false), 4000)
    } catch (err) {
      setError(err.message)
    } finally {
      setActivando(null)
    }
  }

  async function cancelarPlan() {
    if (!window.confirm('¿Seguro que quieres cancelar el plan Premium? El piso volverá al plan gratuito cuando caduque.')) return
    setError('')
    try {
      await supabase
        .from('subscripcions')
        .update({ estat: 'cancelada' })
        .eq('pis_id', pis.id)
        .eq('estat', 'activa')
      await refreshSubscripcio()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">💳 Plan y suscripción</span>
      </div>
      <div className="page-content" style={{ maxWidth: 760, margin: '0 auto' }}>

        {exito && (
          <div className="alert alert-success animate-in" style={{ marginBottom: 20 }}>
            🎉 ¡Plan activado con éxito! Ya tienes acceso a todas las funciones Premium.
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Estado actual */}
        <div className="card animate-in-1" style={{ marginBottom: 24, borderLeft: `4px solid ${premium ? 'var(--teal)' : 'var(--gray-300)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 40 }}>{premium ? '⭐' : '🏠'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                {premium ? `Plan ${subscripcio?.pla === 'annual' ? 'Premium Anual' : 'Premium Mensual'}` : 'Plan Gratuito'}
              </div>
              {premium && dataFin && (
                <div style={{ fontSize: 13, color: diasRestantes < 7 ? 'var(--coral)' : 'var(--gray-400)' }}>
                  {diasRestantes < 7
                    ? `⚠️ Caduca en ${diasRestantes} días — ${dataFin.toLocaleDateString('es-ES')}`
                    : `✓ Activo hasta el ${dataFin.toLocaleDateString('es-ES')} (${diasRestantes} días)`
                  }
                </div>
              )}
              {!premium && (
                <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                  Hasta 4 residentes · Funciones básicas
                </div>
              )}
            </div>
            {premium && rolUsuari === 'administrador' && (
              <button className="btn btn-sm" style={{ color: 'var(--coral)' }} onClick={cancelarPlan}>
                Cancelar plan
              </button>
            )}
          </div>
        </div>

        {rolUsuari !== 'administrador' && (
          <div className="alert" style={{ background: 'var(--amber-light)', color: 'var(--amber)', border: '1px solid rgba(186,117,23,0.2)', marginBottom: 20 }}>
            ℹ️ Solo el administrador del piso puede cambiar el plan.
          </div>
        )}

        {/* Planes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {PLANES.map((plan, i) => {
            const esActivo = (!premium && plan.id === 'free') || (premium && subscripcio?.pla === plan.id)
            return (
              <div
                key={plan.id}
                className={`card animate-in-${i + 1}`}
                style={{
                  position: 'relative', overflow: 'hidden',
                  border: plan.destacado ? `2px solid ${plan.color}` : esActivo ? `2px solid ${plan.color}` : 'var(--border)',
                  boxShadow: plan.destacado ? `0 8px 32px ${plan.color}30` : 'var(--shadow-sm)',
                  transform: plan.destacado ? 'scale(1.02)' : 'none',
                }}
              >
                {plan.destacado && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${plan.color}, #2DCE96)` }} />
                )}
                {esActivo && (
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <span style={{ background: plan.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10 }}>ACTIVO</span>
                  </div>
                )}
                {plan.ahorro && (
                  <div style={{ background: 'var(--teal-light)', color: 'var(--teal)', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, display: 'inline-block', marginBottom: 12 }}>
                    💰 Ahorras {plan.ahorro}
                  </div>
                )}

                <div style={{ fontSize: 28, marginBottom: 8 }}>{plan.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{plan.nombre}</div>

                <div style={{ marginBottom: 18 }}>
                  <span style={{ fontFamily: 'Sora, sans-serif', fontSize: plan.id === 'free' ? 36 : 32, fontWeight: 900 }}>
                    {plan.id === 'free' ? '0€' : plan.id === 'monthly' ? '5,99€' : '59,99€'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--gray-400)', marginLeft: 4 }}>{plan.periodo}</span>
                  {plan.id === 'annual' && (
                    <div style={{ fontSize: 11, color: 'var(--teal)', marginTop: 2 }}>≈ 4,99€/mes</div>
                  )}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 20 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#555', padding: '6px 0', borderBottom: '1px solid var(--gray-50)' }}>
                      <span style={{ color: plan.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.id === 'free' ? (
                  <div className="btn" style={{ width: '100%', justifyContent: 'center', opacity: 0.5, cursor: 'default', fontSize: 13 }}>
                    Plan actual
                  </div>
                ) : esActivo ? (
                  <div className="btn" style={{ width: '100%', justifyContent: 'center', opacity: 0.6, cursor: 'default', background: 'var(--gray-50)', fontSize: 13 }}>
                    ✓ Activo
                  </div>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', background: plan.color, borderColor: plan.color, fontSize: 13 }}
                    onClick={() => activarPlan(plan)}
                    disabled={activando !== null || rolUsuari !== 'administrador'}
                  >
                    {activando === plan.id ? 'Activando...' : `Activar ${plan.nombre}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Nota sobre pagos */}
        <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', border: 'var(--border)', fontSize: 12, color: 'var(--gray-400)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--gray-700)' }}>ℹ️ Sobre los pagos:</strong> Actualmente los planes se activan directamente (fase beta). La integración con Stripe para pagos reales está en desarrollo. El límite de 4 residentes se aplica automáticamente en el plan gratuito.
        </div>
      </div>
    </div>
  )
}
