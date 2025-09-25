/**
 * =====================================================
 * CLIENTE SUPABASE - BOOKEXCHANGE
 * Configuração do cliente Supabase para uso no frontend
 * =====================================================
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
// Note: Database type temporarily commented out for build compatibility
// import type { Database } from '@/types/supabase'

// =====================================================
// VALIDAÇÃO DAS VARIÁVEIS DE AMBIENTE
// =====================================================

/** URL do projeto Supabase */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
/** Chave pública (anônima) do Supabase */
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validar se as variáveis de ambiente estão configuradas
if (!supabaseUrl) {
  throw new Error(
    '❌ NEXT_PUBLIC_SUPABASE_URL não está definida no arquivo .env.local'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    '❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida no arquivo .env.local'
  )
}

// =====================================================
// CLIENTE SUPABASE
// =====================================================

/**
 * Cliente Supabase configurado para a aplicação BookExchange
 * 
 * Funcionalidades incluídas:
 * - Autenticação de usuários
 * - Operações CRUD no banco de dados
 * - Subscriptions em tempo real
 * - Row Level Security (RLS) automático
 * 
 * @example
 * ```typescript
 * // Buscar livros
 * const { data: books } = await supabase
 *   .from('books')
 *   .select('*')
 * 
 * // Autenticação
 * const { data, error } = await supabase.auth.signInWithPassword({
 *   email: 'user@example.com',
 *   password: 'senha123'
 * })
 * ```
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Configurações de autenticação
      persistSession: true,          // Manter sessão ativa
      autoRefreshToken: true,        // Renovar token automaticamente
      detectSessionInUrl: true,      // Detectar sessão na URL (para magic links)
    },
    realtime: {
      // Configurações de tempo real
      params: {
        eventsPerSecond: 10,         // Limite de eventos por segundo
      },
    },
  }
)

// =====================================================
// FUNÇÕES UTILITÁRIAS DE AUTENTICAÇÃO
// =====================================================

/**
 * Obtém o usuário atualmente autenticado
 * 
 * @returns Promise com os dados do usuário ou null se não autenticado
 * 
 * @example
 * ```typescript
 * const user = await getCurrentUser()
 * if (user) {
 *   console.log('Usuário logado:', user.email)
 * }
 * ```
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('❌ Erro ao obter usuário atual:', error)
    return null
  }
}

/**
 * Obtém a sessão atual do usuário
 * 
 * @returns Promise com os dados da sessão ou null se não houver sessão ativa
 * 
 * @example
 * ```typescript
 * const session = await getCurrentSession()
 * if (session) {
 *   console.log('Token de acesso:', session.access_token)
 * }
 * ```
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('❌ Erro ao obter sessão atual:', error)
    return null
  }
}

/**
 * Verifica se o usuário está autenticado
 * 
 * @returns Promise boolean indicando se há um usuário logado
 * 
 * @example
 * ```typescript
 * const isAuthenticated = await checkAuthStatus()
 * if (isAuthenticated) {
 *   // Usuário está logado
 * } else {
 *   // Redirecionar para login
 * }
 * ```
 */
export const checkAuthStatus = async (): Promise<boolean> => {
  const user = await getCurrentUser()
  return user !== null
}
