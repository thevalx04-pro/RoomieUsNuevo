import { useEffect, useRef, useState, useCallback } from 'react'
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
  const inputRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (!pis) return
    fetchMensajes()
    const channel = supabase
      .channel(`chat-${pis.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'missatges', filter: `pis_id=eq.${pis.id}` },
        payload => {
          // Solo añadir si no es nuestro propio mensaje (que ya añadimos optimísticamente)
          if (payload.new.autor_id !== user.id) {
            supabase.from('missatges').select('*, usuaris(nom)').eq('id', payload.new.id).single()
              .then(({ data }) => { if (data) setMensajes(prev => [...prev, data]) })
          }
        })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [pis])

  useEffect(() => { scrollToBottom() }, [mensajes])

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
    e?.preventDefault()
    if (!texto.trim()) return
    const contingut = texto.trim()
    setTexto('')

    // Optimistic update: mostrar el mensaje inmediatamente
    const tempId = `temp-${Date.now()}`
    const tempMsg = {
      id: tempId,
      contingut,
      autor_id: user.id,
      data_hora: new Date().toISOString(),
      usuaris: { nom: 'Tú' },
      _sending: true,
    }
    setMensajes(prev => [...prev, tempMsg])

    const { data, error } = await supabase
      .from('missatges')
      .insert({ pis_id: pis.id, autor_id: user.id, contingut })
      .select('*, usuaris(nom)')
      .single()

    if (!error && data) {
      // Reemplazar el mensaje temporal con el real
      setMensajes(prev => prev.map(m => m.id === tempId ? data : m))
    } else {
      // Si falló, quitar el temporal
      setMensajes(prev => prev.filter(m => m.id !== tempId))
    }

    inputRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  async function eliminar(id) {
    if (id.startsWith?.('temp-')) return
    await supabase.from('missatges').update({ eliminat: true }).eq('id', id)
    setMensajes(prev => prev.filter(m => m.id !== id))
  }

  const iniciales = nom => nom?.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase() || 'U'

  if (!pis) return (
    <div className="page-content">
      <div className="empty"><p>Primero debes crear o unirte a un piso.</p></div>
    </div>
  )

  return (
    <div className="chat-layout">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="chat-status-dot" />
          <span className="topbar-title">Chat del piso · {pis.nom}</span>
        </div>
      </div>

      <div className="chat-messages">
        {loading && (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        )}
        {!loading && mensajes.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <p>¡Empieza la conversación con tus compañeros!</p>
          </div>
        )}

        {mensajes.map((m, i) => {
          const mio = m.autor_id === user.id
          const prevMio = i > 0 && mensajes[i - 1].autor_id === user.id
          const showAvatar = !mio && !prevMio

          return (
            <div key={m.id} className={`msg-row ${mio ? 'mine' : ''} ${m._sending ? 'sending' : ''}`}>
              {!mio && (
                <div className="msg-avatar-col">
                  {showAvatar
                    ? <div className="avatar sm">{iniciales(m.usuaris?.nom)}</div>
                    : <div style={{ width: 26 }} />
                  }
                </div>
              )}
              <div className="msg-content">
                {!mio && showAvatar && (
                  <div className="msg-sender">{m.usuaris?.nom}</div>
                )}
                <div className={`msg-bubble ${mio ? 'mine' : ''}`}>
                  <span className="msg-text">{m.contingut}</span>
                  {mio && !m._sending && (
                    <button
                      onClick={() => eliminar(m.id)}
                      className="msg-delete"
                      title="Eliminar"
                    >✕</button>
                  )}
                  {m._sending && <span className="msg-sending-dot">•••</span>}
                </div>
                <div className={`msg-time ${mio ? 'right' : ''}`}>
                  {m._sending ? 'Enviando...' : new Date(m.data_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <input
          ref={inputRef}
          className="chat-input"
          placeholder="Escribe un mensaje... (Enter para enviar)"
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <button
          className="btn btn-primary chat-send-btn"
          onClick={enviar}
          disabled={!texto.trim()}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
