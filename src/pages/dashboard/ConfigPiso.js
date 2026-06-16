import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { usePis } from '../../context/PisContext'

export default function ConfigPiso() {
  const { pis, rolUsuari, refetch } = usePis()
  const [form, setForm] = useState({ nom: pis?.nom || '', limit: pis?.limit_residents || 5, normes: pis?.normes || '' })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (rolUsuari !== 'administrador') return (
    <div className="page-content"><div className="empty"><p>Solo el administrador puede acceder a la configuración.</p></div></div>
  )

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar(e) {
    e.preventDefault()
    if (!form.nom.trim()) return setError('El nombre del piso no puede estar vacío')
    setSaving(true); setError(''); setSuccess('')
    try {
      await supabase.from('pisos').update({
        nom: form.nom, limit_residents: parseInt(form.limit), normes: form.normes
      }).eq('id', pis.id)
      await refetch()
      setSuccess('Configuración guardada correctamente.')
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="topbar"><span className="topbar-title">Configuración del piso</span></div>
      <div className="page-content" style={{ maxWidth: 500 }}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div className="card">
          <div className="card-title">Datos del piso</div>
          <form onSubmit={guardar}>
            <div className="form-group">
              <label className="form-label">Nombre del piso</label>
              <input className="form-input" value={form.nom} onChange={set('nom')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Límite de residentes</label>
              <input className="form-input" type="number" min="2" max="20" value={form.limit} onChange={set('limit')} />
            </div>
            <div className="form-group">
              <label className="form-label">Normas internas del piso</label>
              <textarea className="form-input" rows={5} placeholder="Ej: No fumar, silencio a las 23h..."
                value={form.normes} onChange={set('normes')} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <div className="card-title">Código de invitación</div>
          <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: 'var(--purple)', letterSpacing: 3, margin: '8px 0' }}>
            {pis?.codi_invitacio}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
            Comparte este código con nuevos residentes para que se unan al piso sin necesidad de invitación por correo.
          </div>
        </div>
      </div>
    </div>
  )
}
