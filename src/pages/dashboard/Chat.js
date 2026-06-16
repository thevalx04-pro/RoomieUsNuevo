import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { usePis } from '../../context/PisContext'

export default function Chat() {
  const { user } = useAuth()
  const { pis } = usePis()
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!pis) return
    fetchMensajes()
    const channel = supabase
      .channel(`chat-${pis.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'missatges', filter: `pis_id=eq.${pis.id}` },
        payload => {
          supabase.from('missatges').select('*, usuaris(nom)').eq('id', payload.new.id).single()
            .then(({ data }) => { if (data) setMensajes(prev => [...prev, data]) })
        })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [pis])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensajes])

  async function fetchMensajes() {
    const { data } = await supabase.from('missatges')
      .select('*, usuaris(nom)')
      .eq('pis_id', pis.id)
      .eq('eliminat', false)
      .order('data_hora', { ascending: true })
      .limit(200)
    setMensajes(data || [])
    setLoading(false)
  }

  async function enviar(e) {
    e.preventDefault()
    if (!texto.trim()) return
    const contingut = texto.trim()
    setTexto('')
    await supabase.from('missatges').insert({ pis_id: pis.id, autor_id: user.id, contingut })
  }

  async function eliminar(id) {
    await supabase.from('missatges').update({ eliminat: true }).eq('id', id)
    setMensajes(prev => prev.filter(m => m.id !== id))
  }

  const iniciales = nom => nom?.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() || 'U'

  if (!pis) return <div className="page-content"><div className="empty"><p>Primero debes crear o unirte a un piso.</p></div></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="topbar">
        <span className="topbar-title">Chat del piso · {pis.nom}</span>
      </div>
      <div className="chat-messages">
        {loading && <div className="loading-center"><div className="spinner" /></div>}
        {!loading && mensajes.length === 0 && (
          <div className="empty" style={{ margin: 'auto' }}>
            <div className="empty-icon">💬</div>
            <p>¡Empieza la conversación con tus compañeros!</p>
          </div>
        )}
        {mensajes.map(m => {
          const mio = m.autor_id === user.id
          return (
            <div key={m.id} className={`msg-row ${mio ? 'mine' : ''}`}>
              {!mio && <div className="avatar sm">{iniciales(m.usuaris?.nom)}</div>}
              <div>
                {!mio && <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 2 }}>{m.usuaris?.nom}</div>}
                <div className={`msg-bubble ${mio ? 'mine' : ''}`}>
                  {m.contingut}
                  {mio && (
                    <button onClick={() => eliminar(m.id)} style={{ marginLeft: 8, fontSize: 10, color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                  )}
                </div>
                <div className="msg-meta" style={{ textAlign: mio ? 'right' : 'left' }}>
                  {new Date(m.data_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <form className="chat-input-bar" onSubmit={enviar}>
        <input className="form-input" placeholder="Escribe un mensaje..." value={texto}
          onChange={e => setTexto(e.target.value)} autoComplete="off" />
        <button className="btn btn-primary" type="submit" disabled={!texto.trim()}>Enviar</button>
      </form>
    </div>
  )
}
