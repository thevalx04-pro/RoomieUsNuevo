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

  async function registrar(correu, contrasenya, nom) {
    if (!correu.endsWith('@id.uib.eu') && !correu.endsWith('@uib.es')) {
      throw new Error('Has d\'usar el correu institucional de la UIB (@id.uib.eu)')
    }
    const { error } = await supabase.auth.signUp({
      email: correu,
      password: contrasenya,
      options: { data: { nom } }
    })
    if (error) throw error
  }

  async function iniciarSessio(correu, contrasenya) {
    const { error } = await supabase.auth.signInWithPassword({ email: correu, password: contrasenya })
    if (error) throw new Error('Correu o contrasenya incorrectes')
  }

  async function tancarSessio() {
    await supabase.auth.signOut()
  }

  async function recuperarContrasenya(correu) {
    const { error } = await supabase.auth.resetPasswordForEmail(correu, {
      redirectTo: `${window.location.origin}/nova-contrasenya`
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, registrar, iniciarSessio, tancarSessio, recuperarContrasenya }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
