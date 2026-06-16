import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchPerfil(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchPerfil(session.user.id)
      else { setPerfil(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchPerfil(userId) {
    const { data } = await supabase.from('usuaris').select('*').eq('id', userId).single()
    setPerfil(data)
    setLoading(false)
  }

  function validarCorreo(correu) {
    // Acepta cualquier correo válido (gmail, hotmail, yahoo, etc.)
    const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
    return regex.test(correu)
  }

  async function registrar(correu, contrasenya, nom) {
    if (!validarCorreo(correu)) {
      throw new Error('Introduce un correo electrónico válido (ej: tunombre@gmail.com)')
    }
    const { error } = await supabase.auth.signUp({
      email: correu,
      password: contrasenya,
      options: { data: { nom } }
    })
    if (error) throw new Error('Error al crear la cuenta: ' + error.message)
  }

  async function iniciarSessio(correu, contrasenya) {
    const { error } = await supabase.auth.signInWithPassword({ email: correu, password: contrasenya })
    if (error) throw new Error('Correo o contraseña incorrectos')
  }

  async function tancarSessio() {
    await supabase.auth.signOut()
  }

  async function recuperarContrasenya(correu) {
    const { error } = await supabase.auth.resetPasswordForEmail(correu, {
      redirectTo: `${window.location.origin}/nueva-contrasena`
    })
    if (error) throw new Error('No se pudo enviar el correo de recuperación')
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, registrar, iniciarSessio, tancarSessio, recuperarContrasenya }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
