'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User, Session } from '@supabase/supabase-js'
import { useHardRefreshProtection } from '@/hooks/useHardRefreshProtection'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  
  const supabase = createClientComponentClient()
  const { wasHardRefresh } = useHardRefreshProtection()

  // Helper to check if session is still valid
  const isSessionValid = (session: Session | null): boolean => {
    if (!session) return false
    const now = Math.floor(Date.now() / 1000)
    return session.expires_at ? session.expires_at > now : true
  }

  // Helper to check if session is expiring soon (within 5 minutes)
  const isSessionExpiringSoon = (session: Session | null): boolean => {
    if (!session) return false
    const now = Math.floor(Date.now() / 1000)
    const fiveMinutesFromNow = now + (5 * 60)
    return session.expires_at ? session.expires_at < fiveMinutesFromNow : false
  }

  // Function to refresh session
  const refreshSession = async () => {
    try {
      console.log('Tentando renovar sessão...')
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Erro ao renovar sessão:', error)
        return false
      }
      
      if (data.session) {
        console.log('Sessão renovada com sucesso!')
        setSession(data.session)
        setUser(data.session.user)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Erro inesperado ao renovar sessão:', error)
      return false
    }
  }

  useEffect(() => {
    let isMounted = true

    // Failsafe: liberar loading depois de 3s mesmo sem sessão (para GitHub Pages/export)
    const failSafeTimer = setTimeout(() => {
      if (isMounted) {
        console.log('[AuthContext] FailSafe: liberando loading após timeout')
        setLoading(false)
      }
    }, 3000)

    // Get initial session with retry logic
    const getInitialSession = async (retries = 3) => {
      try {
        console.log('Getting initial session, attempt:', 4 - retries)
        
        // Wait longer on hard refresh to ensure Supabase client is fully initialized
        if (initialLoad || wasHardRefresh) {
          const delay = wasHardRefresh ? 300 : 100
          console.log(`Waiting ${delay}ms for Supabase client initialization...`)
          await new Promise(r => setTimeout(r, delay))
        }
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        if (error) {
          console.warn('[AuthContext] Erro ao obter sessão:', error.message)
          
          // Retry on error if we have attempts left
          if (retries > 0) {
            setTimeout(() => getInitialSession(retries - 1), 200)
            return
          }
          
          setSession(null)
          setUser(null)
        } else {
          console.log('Initial session loaded:', session?.user?.email || 'No user')
          
          // Validate session before setting it
          if (session && isSessionValid(session)) {
            setSession(session)
            setUser(session.user)
          } else {
            setSession(null)
            setUser(null)
          }
        }
      } catch (e) {
        console.error('[AuthContext] Exceção getInitialSession:', e)
      } finally {
        if (isMounted) {
          setLoading(false)
          setInitialLoad(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return
        
        console.log('[AuthContext] Auth event:', event)
        
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
          case 'INITIAL_SESSION':
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
            break
          case 'SIGNED_OUT':
            setSession(null)
            setUser(null)
            setLoading(false)
            break
        }
      }
    )

    // Set up automatic session refresh timer
    const sessionCheckInterval = setInterval(() => {
      if (session && isSessionExpiringSoon(session)) {
        console.log('Sessão expirando em breve, renovando automaticamente...')
        refreshSession()
      }
    }, 60000) // Check every minute

    return () => {
      console.log('Cleaning up auth subscription and timers')
      isMounted = false
      clearTimeout(failSafeTimer)
      subscription.unsubscribe()
      clearInterval(sessionCheckInterval)
    }
  }, [supabase.auth, initialLoad])

  const signOut = async () => {
    try {
      console.log('Signing out user explicitly')
      setLoading(true)
      
      // Clear state immediately
      setSession(null)
      setUser(null)
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error signing out:', error)
      } else {
        console.log('Successfully signed out')
      }
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}