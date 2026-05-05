import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Usuario = Database['public']['Tables']['usuarios']['Row']

interface AuthState {
  user: Usuario | null
  session: any | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginDemo: () => void
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,

  loginDemo: () => {
    set({ 
      user: {
        id: 'demo-user-id',
        nombre: 'Usuario Demo (Admin)',
        email: 'demo@municipio.gob.ar',
        rol: 'compras',
        area_id: null,
        activo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        password_hash: ''
      }, 
      session: { user: { id: 'demo-user-id' } },
      isLoading: false 
    })
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      // Fetch user profile from public.usuarios
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (userError) throw userError
      
      if (userData && !userData.activo) {
        await supabase.auth.signOut()
        throw new Error('Su cuenta está pendiente de aprobación por un administrador.')
      }
      
      set({ user: userData, session: data.session, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  initialize: async () => {
    // If we already have a user (e.g. demo mode), don't overwrite with null
    const currentUser = useAuthStore.getState().user
    
    set({ isLoading: true })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data: userData } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single()
          
        set({ user: userData, session, isLoading: false })
      } else {
        // Only set to null if we didn't have a user before (not in demo mode)
        set({ 
          user: currentUser?.id === 'demo-user-id' ? currentUser : null, 
          session: null, 
          isLoading: false 
        })
      }
    } catch (error) {
      set({ 
        user: currentUser?.id === 'demo-user-id' ? currentUser : null, 
        session: null, 
        isLoading: false 
      })
    }
  }
}))
