import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { usePis } from '../../context/PisContext'

export default function ConfigPis() {
  const { pis, rolUsuari, refetch } = usePis()
  const [form, setForm] = useState({ nom: pis?.nom || '', limit: pis?.limit_residents || 5, normes: pis?.normes || '' })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (rolUsuari !== 'administrador') return (
    <div className="page-content"><div className="empty"><p>Només l'administrador pot accedir a la configuració.</p></div></div>
  )

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function guardar(e) {
    e.preventDefault()
    if (!form.nom.trim()) return setError('El nom del pis no pot estar buit')
    setSaving(true); setError(''); setSuccess('')
    try {
      await supabase.from('pisos').update({
        nom: form.nom, limit_residents: parseInt(form.limit), normes: form.normes
      }).eq('id', pis.id)
      await refetch()
      setSuccess('Configuració guardada correctament.')
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="topbar"><span className="topbar-title">Configuració del pis</span></div>
      <div className="page-content" style={{ maxWidth: 500 }}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div className="card">
          <div className="card-title">Dades del pis</div>
          <form onSubmit={guardar}>
            <div className="form-group">
              <label className="form-label">Nom del pis</label>
              <input className="form-input" value={form.nom} onChange={set('nom')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Límit de residents</label>
              <input className="form-input" type="number" min="2" max="20" value={form.limit} onChange={set('limit')} />
            </div>
            <div className="form-group">
              <label className="form-label">Normes internes del pis</label>
              <textarea className="form-input" rows={5} placeholder="Ex: No fumar, silenci a les 23h..."
                value={form.normes} onChange={set('normes')} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                {saving ? 'Guardant...' : 'Guardar canvis'}
              </button>
            </div>
          </form>
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <div className="card-title">Codi d'invitació</div>
          <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: 'var(--purple)', letterSpacing: 3, margin: '8px 0' }}>
            {pis?.codi_invitacio}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
            Comparteix aquest codi amb nous residents per unir-se al pis sense necessitat d'invitació per correu.
          </div>
        </div>
      </div>
    </div>
  )
}
