import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

export default function Xat() {
  const { user } = useAuth()
  const { pis } = usePis()
  const [missatges, setMissatges] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!pis) return
    fetchMissatges()

    // Supabase Realtime: escolta nous missatges
    const channel = supabase
      .channel(`xat-${pis.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'missatges',
        filter: `pis_id=eq.${pis.id}`
      }, payload => {
        // Fetch el nou missatge amb join d'usuari
        supabase.from('missatges').select('*, usuaris(nom)').eq('id', payload.new.id).single()
          .then(({ data }) => { if (data) setMissatges(prev => [...prev, data]) })
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'missatges',
        filter: `pis_id=eq.${pis.id}`
      }, () => fetchMissatges())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [pis])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [missatges])

  async function fetchMissatges() {
    const { data } = await supabase.from('missatges')
      .select('*, usuaris(nom)')
      .eq('pis_id', pis.id)
      .eq('eliminat', false)
      .order('data_hora', { ascending: true })
      .limit(200)
    setMissatges(data || [])
    setLoading(false)
  }

  async function enviar(e) {
    e.preventDefault()
    if (!text.trim()) return
    const contingut = text.trim()
    setText('')
    await supabase.from('missatges').insert({
      pis_id: pis.id, autor_id: user.id, contingut
    })
  }

  async function eliminar(id) {
    await supabase.from('missatges').update({ eliminat: true }).eq('id', id)
    setMissatges(prev => prev.filter(m => m.id !== id))
  }

  const inicials = nom => nom?.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() || 'U'

  if (!pis) return <div className="page-content"><div className="empty"><p>Primer has de crear o unir-te a un pis.</p></div></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="topbar">
        <span className="topbar-title">Xat del pis · {pis.nom}</span>
      </div>

      <div className="chat-messages">
        {loading && <div className="loading-center"><div className="spinner" /></div>}
        {!loading && missatges.length === 0 && (
          <div className="empty" style={{ margin: 'auto' }}>
            <div className="empty-icon">💬</div>
            <p>Comença la conversa amb els teus companys!</p>
          </div>
        )}
        {missatges.map(m => {
          const meu = m.autor_id === user.id
          return (
            <div key={m.id} className={`msg-row ${meu ? 'mine' : ''}`}>
              {!meu && <div className="avatar sm">{inicials(m.usuaris?.nom)}</div>}
              <div>
                {!meu && <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 2 }}>{m.usuaris?.nom}</div>}
                <div className={`msg-bubble ${meu ? 'mine' : ''}`}>
                  {m.contingut}
                  {meu && (
                    <button onClick={() => eliminar(m.id)} style={{ marginLeft: 8, fontSize: 10, color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer' }} title="Eliminar">✕</button>
                  )}
                </div>
                <div className={`msg-meta ${meu ? '' : ''}`} style={{ textAlign: meu ? 'right' : 'left' }}>
                  {new Date(m.data_hora).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-bar" onSubmit={enviar}>
        <input className="form-input" placeholder="Escriu un missatge..." value={text}
          onChange={e => setText(e.target.value)} autoComplete="off" />
        <button className="btn btn-primary" type="submit" disabled={!text.trim()}>Enviar</button>
      </form>
    </div>
  )
}
