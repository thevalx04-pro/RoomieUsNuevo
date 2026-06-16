import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const PisContext = createContext({})

export function PisProvider({ children }) {
  const { user } = useAuth()
  const [pis, setPis] = useState(null)
  const [membres, setMembres] = useState([])
  const [rolUsuari, setRolUsuari] = useState('resident')
  const [loading, setLoading] = useState(true)

  const fetchPis = useCallback(async () => {
    if (!user) { setLoading(false); return }
    const { data: membre } = await supabase
      .from('membres_pis')
      .select('*, pisos(*)')
      .eq('usuari_id', user.id)
      .is('data_sortida', null)
      .single()
    if (membre) {
      setPis(membre.pisos)
      setRolUsuari(membre.rol)
      await fetchMembres(membre.pisos.id)
    }
    setLoading(false)
  }, [user])

  async function fetchMembres(pisId) {
    const { data } = await supabase
      .from('membres_pis')
      .select('*, usuaris(id, nom, correu, foto_url)')
      .eq('pis_id', pisId)
      .is('data_sortida', null)
    setMembres(data || [])
  }

  useEffect(() => { fetchPis() }, [fetchPis])

  async function crearPis(nom, limitResidents, normes) {
    const { data: nouPis, error } = await supabase
      .from('pisos')
      .insert({ nom, limit_residents: limitResidents, normes })
      .select().single()
    if (error) throw error
    await supabase.from('membres_pis').insert({
      usuari_id: user.id, pis_id: nouPis.id, rol: 'administrador'
    })
    await fetchPis()
    return nouPis
  }

  async function convidarMembre(correu) {
    if (!pis) throw new Error('No estás en ningún piso')
    const { error } = await supabase.from('invitacions').insert({ pis_id: pis.id, correu })
    if (error) throw error
  }

  async function acceptarInvitacio(codiOCorreu) {
    const { data: inv, error } = await supabase
      .from('invitacions')
      .select('*')
      .or(`codi.eq.${codiOCorreu},correu.eq.${codiOCorreu}`)
      .eq('estat', 'pendent')
      .single()
    if (error || !inv) throw new Error('Invitación no encontrada o ya usada')
    await supabase.from('membres_pis').insert({
      usuari_id: user.id, pis_id: inv.pis_id, rol: 'resident'
    })
    await supabase.from('invitacions').update({ estat: 'acceptada' }).eq('id', inv.id)
    await fetchPis()
  }

  return (
    <PisContext.Provider value={{ pis, membres, rolUsuari, loading, crearPis, convidarMembre, acceptarInvitacio, refetch: fetchPis }}>
      {children}
    </PisContext.Provider>
  )
}

export const usePis = () => useContext(PisContext)
