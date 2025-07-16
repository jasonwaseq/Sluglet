import { createClient, AuthChangeEvent, Session } from '@supabase/supabase-js'

// Lazy initialization of Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (supabaseClient) {
    return supabaseClient
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured')
  }
  
  // Create client with proper storage configuration for session persistence
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
  
  // Add error handling for refresh token errors
  if (typeof window !== 'undefined') {
    supabaseClient.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // Clear any stored session data
        localStorage.removeItem('supabase.auth.token');
      }
    });
  }
  
  return supabaseClient
}

// For backward compatibility, export a function that returns the client
export const supabase = {
  auth: {
    onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
      try {
        const client = getSupabaseClient()
        return client.auth.onAuthStateChange(callback)
      } catch (error) {
        console.error('Supabase client not available:', error)
        return { data: { subscription: { unsubscribe: () => {} } } }
      }
    },
    getUser: async () => {
      const client = getSupabaseClient()
      return client.auth.getUser()
    },
    getSession: async () => {
      const client = getSupabaseClient()
      return client.auth.getSession()
    },
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      const client = getSupabaseClient()
      return client.auth.signInWithPassword(credentials)
    },
    signUp: async (credentials: { email: string; password: string }) => {
      const client = getSupabaseClient()
      return client.auth.signUp(credentials)
    },
    signOut: async () => {
      const client = getSupabaseClient()
      return client.auth.signOut()
    },
    updateUser: async (updates: { email?: string; password?: string; data?: Record<string, unknown> }) => {
      const client = getSupabaseClient()
      return client.auth.updateUser(updates)
    },
    admin: {
      deleteUser: async (userId: string) => {
        const client = getSupabaseClient()
        return client.auth.admin.deleteUser(userId)
      }
    }
  }
}

// Server-side Supabase client
export const createServerClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Auth helpers
export const getCurrentUser = async () => {
  const client = getSupabaseClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error) throw error
  return user
}

export const getCurrentSession = async () => {
  const client = getSupabaseClient()
  const { data: { session }, error } = await client.auth.getSession()
  if (error) throw error
  return session
}

export const signOut = async () => {
  const client = getSupabaseClient()
  const { error } = await client.auth.signOut()
  if (error) throw error
} 