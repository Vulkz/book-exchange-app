/**
 * =====================================================
 * HOOK DE AUTENTICAÇÃO - BOOKEXCHANGE
 * Gerencia estado de autenticação do usuário
 * =====================================================
 */

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User, Session } from '@supabase/supabase-js'

/**
 * Hook personalizado para gerenciar autenticação de usuários
 * 
 * Funcionalidades:
 * - Controla estado de login/logout
 * - Monitora mudanças de sessão em tempo real
 * - Fornece dados do usuário autenticado
 * - Gerencia loading states
 * 
 * @returns Objeto com dados de autenticação e estados
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { user, loading, session } = useAuth()
 *   
 *   if (loading) return <div>Carregando...</div>
 *   if (!user) return <div>Faça login</div>
 *   
 *   return <div>Bem-vindo, {user.email}!</div>
 * }
 * ```
 */
export function useAuth() {
  // =====================================================
  // ESTADOS LOCAIS
  // =====================================================
  
  /** Usuário atualmente autenticado (null se não logado) */
  const [user, setUser] = useState<User | null>(null)
  
  /** Sessão ativa do usuário (contém tokens de acesso) */
  const [session, setSession] = useState<Session | null>(null)
  
  /** Indica se está carregando dados de autenticação */
  const [loading, setLoading] = useState(true)
  
  // Cliente Supabase para operações de autenticação
  const supabase = createClientComponentClient()

  // =====================================================
  // EFEITOS E LISTENERS
  // =====================================================
  
  useEffect(() => {
    /**
     * Obtém a sessão inicial do usuário ao carregar o hook
     * Executado apenas uma vez na montagem do componente
     */
    const getInitialSession = async () => {
      try {
        // Buscar sessão existente do Supabase
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Erro ao obter sessão inicial:', error)
        } else {
          // Atualizar estados com dados da sessão
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session) {
            console.log('✅ Sessão recuperada para:', session.user.email)
          }
        }
      } catch (error) {
        console.error('❌ Erro inesperado ao obter sessão:', error)
      } finally {
        // Sempre parar o loading, mesmo em caso de erro
        setLoading(false)
      }
    }

    // Executar busca inicial da sessão
    getInitialSession()

    /**
     * Listener para mudanças de estado de autenticação
     * Monitora eventos como login, logout, renovação de token, etc.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Evento de autenticação:', event)
        
        // Tratar diferentes tipos de eventos de autenticação
        switch (event) {
          case 'SIGNED_IN':
            // Usuário fez login com sucesso
            console.log('✅ Usuário logado:', session?.user.email)
            setSession(session)
            setUser(session?.user ?? null)
            break
            
          case 'SIGNED_OUT':
            // Usuário fez logout
            console.log('👋 Usuário deslogado')
            setSession(null)
            setUser(null)
            break
            
          case 'TOKEN_REFRESHED':
            // Token de acesso foi renovado automaticamente
            console.log('🔄 Token renovado para:', session?.user.email)
            setSession(session)
            setUser(session?.user ?? null)
            break
            
          default:
            // Ignorar outros eventos para evitar logouts indesejados
            console.log('ℹ️ Evento ignorado:', event)
            break
        }
      }
    )

    // Cleanup: cancelar subscription ao desmontar o componente
    return () => {
      console.log('🧹 Removendo listener de autenticação')
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  // =====================================================
  // FUNÇÕES PÚBLICAS
  // =====================================================

  /**
   * Função para fazer logout do usuário
   * Remove a sessão e limpa os estados locais
   * 
   * @returns Promise que resolve quando o logout é concluído
   */
  const signOut = async () => {
    try {
      console.log('🚪 Iniciando logout...')
      await supabase.auth.signOut()
      console.log('✅ Logout realizado com sucesso')
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error)
      throw new Error('Falha ao fazer logout. Tente novamente.')
    }
  }

  // =====================================================
  // RETORNO DO HOOK
  // =====================================================

  return {
    /** Usuário atualmente autenticado (null se não logado) */
    user,
    
    /** Sessão ativa com tokens de acesso */
    session,
    
    /** Indica se ainda está carregando dados de autenticação */
    loading,
    
    /** Função para fazer logout */
    signOut,
    
    /** Shortcut para verificar se usuário está autenticado */
    isAuthenticated: !!user
  }
}