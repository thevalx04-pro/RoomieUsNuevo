import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const PisContext = createContext(null)
export const usePis = () => useContext(PisContext)

export function PisProvider({ children }) {
  const { user } = useAuth()
  const [pis, setPis] = useState(null)
  const [membres, setMembres] = useState([])
  const [rolUsuari, setRolUsuari] = useState(null)
  const [subscripcio, setSubscripcio] = useState(null)
  const [loading, setLoading] = useState(true)

  const isPremium = useCallback(() => {
    if (!subscripcio) return false
    if (subscripcio.estat !== 'activa') return false
    if (new Date(subscripcio.data_fi) < new Date()) return false
    return true
  }, [subscripcio])

  useEffect(() => {
    if (user) fetchPis()
    else { setPis(null); setMembres([]); setRolUsuari(null); setSubscripcio(null); setLoading(false) }
  }, [user])

  async function fetchPis() {
    setLoading(true)
    // tabla: membres_pis, campo: usuari_id (sin s)
    const { data: membresia } = await supabase
      .from('membres_pis')
      .select('*, pisos(*)')
      .eq('usuari_id', user.id)
      .order('data_entrada', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!membresia) { setLoading(false); return }

    const pisData = membresia.pisos
    setPis(pisData)
    setRolUsuari(membresia.rol)

    // Fetch membres del pis
    const { data: tots } = await supabase
      .from('membres_pis')
      .select('*, usuaris(nom, correu)')
      .eq('pis_id', pisData.id)
    setMembres(tots || [])

    // Fetch subscripció activa del pis
    const { data: sub } = await supabase
      .from('subscripcions')
      .select('*')
      .eq('pis_id', pisData.id)
      .eq('estat', 'activa')
      .order('data_fi', { ascending: false })
      .limit(1)
      .maybeSingle()
    setSubscripcio(sub || null)

    setLoading(false)
  }

  async function crearPis(nom, limit, normes) {
    const { data: nou } = await supabase
      .from('pisos')
      .insert({ nom, limit_residents: limit || 4, normes })
      .select().single()
    await supabase.from('membres_pis').insert({
      pis_id: nou.id,
      usuari_id: user.id,
      rol: 'administrador'
    })
    await fetchPis()
  }

  async function acceptarInvitacio(codi) {
    const { data: inv } = await supabase
      .from('invitacions')
      .select('*, pisos(*)')
      .eq('codi', codi)
      .eq('estat', 'pendent')
      .maybeSingle()
    if (!inv) throw new Error('Código de invitación inválido o caducado')

    // Contar residentes actuales
    const { count } = await supabase
      .from('membres_pis')
      .select('*', { count: 'exact', head: true })
      .eq('pis_id', inv.pis_id)

    // Comprobar si tiene premium
    const { data: sub } = await supabase
      .from('subscripcions')
      .select('*')
      .eq('pis_id', inv.pis_id)
      .eq('estat', 'activa')
      .order('data_fi', { ascending: false })
      .limit(1)
      .maybeSingle()

    const pisEsPremium = sub && new Date(sub.data_fi) > new Date()
    const limite = pisEsPremium ? Infinity : 4

    if (count >= limite) {
      throw new Error(
        pisEsPremium
          ? 'Este piso ha alcanzado su límite de residentes.'
          : 'Este piso ha alcanzado el límite de 4 residentes (plan gratuito). El administrador debe actualizar al plan Premium.'
      )
    }

    await supabase.from('membres_pis').insert({
      pis_id: inv.pis_id,
      usuari_id: user.id,
      rol: 'resident'
    })
    await supabase.from('invitacions').update({ estat: 'acceptada' }).eq('id', inv.id)
    await fetchPis()
  }

  async function invitar(email) {
    if (!pis) throw new Error('No hay piso activo')
    const codi = Math.random().toString(36).substring(2, 10)
    await supabase.from('invitacions').insert({
      pis_id: pis.id,
      correu: email,
      codi,
      estat: 'pendent'
    })
    return codi
  }

  async function expulsarMembre(membreId) {
    await supabase.from('membres_pis').delete().eq('id', membreId)
    await fetchPis()
  }

  async function refreshSubscripcio() {
    if (!pis) return
    const { data: sub } = await supabase
      .from('subscripcions')
      .select('*')
      .eq('pis_id', pis.id)
      .eq('estat', 'activa')
      .order('data_fi', { ascending: false })
      .limit(1)
      .maybeSingle()
    setSubscripcio(sub || null)
  }

  return (
    <PisContext.Provider value={{
      pis, membres, rolUsuari, loading,
      subscripcio, isPremium,
      crearPis, acceptarInvitacio, invitar, expulsarMembre,
      refreshSubscripcio, fetchPis,
    }}>
      {children}
    </PisContext.Provider>
  )
}
