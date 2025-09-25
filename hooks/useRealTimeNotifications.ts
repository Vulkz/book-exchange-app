/**
 * =====================================================
 * HOOK DE NOTIFICAÇÕES EM TEMPO REAL - BOOKEXCHANGE
 * Gerencia notificações do usuário com atualizações em tempo real
 * =====================================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

/**
 * Interface para estrutura de notificações do sistema
 * Define o formato padrão de todas as notificações
 */
export interface Notification {
  /** ID único da notificação */
  id: string
  
  /** ID do usuário que receberá a notificação */
  user_id: string
  
  /** Tipo da notificação - determina o comportamento e estilo */
  type: 'book_request' | 'request_accepted' | 'request_rejected' | 'new_request'
  
  /** Título principal da notificação */
  title: string
  
  /** Mensagem detalhada da notificação */
  message: string
  
  /** Indica se a notificação foi lida pelo usuário */
  read: boolean
  
  /** Data/hora de criação da notificação */
  created_at: string
  
  /** Dados adicionais específicos do tipo de notificação */
  data?: {
    request_id?: string
    book_id?: string
    requester_id?: string
    requester_name?: string
    owner_message?: string
  }
}

/**
 * Hook para gerenciar notificações em tempo real
 * 
 * Funcionalidades:
 * - Busca notificações iniciais do usuário
 * - Monitora novas notificações via WebSocket
 * - Controla contador de não lidas
 * - Permite marcar como lida/não lida
 * - Gerencia loading states
 * 
 * @param userId ID do usuário para filtrar notificações
 * @returns Objeto com notificações, funções de controle e estados
 * 
 * @example
 * ```typescript
 * function NotificationCenter() {
 *   const { notifications, unreadCount, markAsRead } = useRealTimeNotifications(user?.id)
 *   
 *   return (
 *     <div>
 *       <h3>Notificações ({unreadCount})</h3>
 *       {notifications.map(notification => (
 *         <div key={notification.id} onClick={() => markAsRead(notification.id)}>
 *           {notification.title}
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useRealTimeNotifications(userId?: string) {
  // =====================================================
  // ESTADOS LOCAIS COM PERSISTÊNCIA
  // =====================================================
  
  /** Lista de todas as notificações do usuário */
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Tentar carregar do localStorage como fallback
    if (typeof window !== 'undefined' && userId) {
      try {
        const cached = localStorage.getItem(`notifications_${userId}`)
        return cached ? JSON.parse(cached) : []
      } catch (error) {
        console.warn('Erro ao carregar notificações do cache:', error)
        return []
      }
    }
    return []
  })
  
  /** Contador de notificações não lidas */
  const [unreadCount, setUnreadCount] = useState(() => {
    // Tentar carregar do localStorage como fallback
    if (typeof window !== 'undefined' && userId) {
      try {
        const cached = localStorage.getItem(`unreadCount_${userId}`)
        return cached ? parseInt(cached, 10) : 0
      } catch (error) {
        console.warn('Erro ao carregar contador do cache:', error)
        return 0
      }
    }
    return 0
  })
  
  /** Indica se está carregando notificações iniciais */
  const [loading, setLoading] = useState(true)

  // =====================================================
  // PERSISTÊNCIA NO LOCALSTORAGE
  // =====================================================
  
  // Salvar notificações no localStorage sempre que mudarem
  useEffect(() => {
    if (typeof window !== 'undefined' && userId && userId.trim() !== '') {
      try {
        // Sempre salvar, mesmo se a lista estiver vazia (para limpar o cache quando necessário)
        localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications))
        localStorage.setItem(`unreadCount_${userId}`, unreadCount.toString())
        localStorage.setItem(`notifications_lastUpdate_${userId}`, Date.now().toString())
        
        console.log('💾 Notificações salvas no cache:', {
          userId,
          count: notifications.length,
          unread: unreadCount
        })
      } catch (error) {
        console.warn('Erro ao salvar notificações no cache:', error)
      }
    }
  }, [notifications, unreadCount, userId])

  // =====================================================
  // BUSCA INICIAL DE NOTIFICAÇÕES
  // =====================================================
  
  useEffect(() => {
    console.log('🚀 useRealTimeNotifications - userId recebido:', userId)
    
    // Não executar se não tiver userId válido
    if (!userId || userId.trim() === '') {
      console.warn('⚠️ userId inválido ou não fornecido para useRealTimeNotifications')
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    // Verificar se já temos notificações no cache válidas
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`notifications_${userId}`)
        const lastUpdate = localStorage.getItem(`notifications_lastUpdate_${userId}`)
        
        if (cached && lastUpdate) {
          const cacheAge = Date.now() - parseInt(lastUpdate)
          const oneMinute = 60 * 1000 // 1 minuto em ms
          
          if (cacheAge < oneMinute) {
            const cachedNotifications = JSON.parse(cached)
            const cachedCount = localStorage.getItem(`unreadCount_${userId}`)
            
            console.log('📦 Usando cache válido durante busca inicial:', {
              count: cachedNotifications.length,
              age: Math.round(cacheAge / 1000) + 's'
            })
            
            setNotifications(cachedNotifications)
            setUnreadCount(cachedCount ? parseInt(cachedCount) : 0)
          }
        }
      } catch (error) {
        console.warn('Erro ao carregar cache inicial:', error)
      }
    }

    /**
     * Busca as notificações iniciais do usuário
     * Implementa fallback para compatibilidade com diferentes versões do schema
     */
    const fetchNotifications = async () => {
      try {
        console.log('📬 Buscando notificações para usuário:', userId)
        
        // Tentativa principal: buscar todas as colunas
        let { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        // Fallback: se coluna 'read' não existir, buscar sem ela
        if (error && error.message.includes('read')) {
          console.log('⚠️ Coluna "read" não encontrada, usando fallback...')
          const result = await supabase
            .from('notifications')
            .select('id, user_id, type, title, message, created_at, data')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
          
          data = result.data
          error = result.error
        }

        console.log('📊 Resultado da busca:', { total: data?.length || 0, error })

        if (error) {
          console.error('❌ Erro ao buscar notificações:', error)
          
          // Tratamento específico para erro de coluna inexistente
          if (error.message?.includes('column "read" does not exist')) {
            console.log('🔧 Coluna "read" não existe, adaptando consulta...')
            
            const { data: dataWithoutRead, error: errorWithoutRead } = await supabase
              .from('notifications')
              .select('id, user_id, type, title, message, created_at')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
            
            if (!errorWithoutRead && dataWithoutRead) {
              // Adicionar campo 'read' como false para compatibilidade
              const notificationsWithRead = dataWithoutRead.map(n => ({ 
                ...n, 
                read: false 
              }))
              
              setNotifications(notificationsWithRead)
              setUnreadCount(notificationsWithRead.length)
              
              console.log('✅ Notificações carregadas (modo compatibilidade):', notificationsWithRead.length)
            }
          }
          return
        }
        
        // Processar notificações recebidas com sucesso
        const serverNotifications = data || []
        
        // Verificar se o cache local ainda é válido (menos de 5 minutos)
        let cachedNotifications: Notification[] = []
        let cachedUnreadCount = 0
        let shouldUseCache = false
        
        if (typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem(`notifications_${userId}`)
            const cachedCount = localStorage.getItem(`unreadCount_${userId}`)
            const lastUpdate = localStorage.getItem(`notifications_lastUpdate_${userId}`)
            
            if (cached && lastUpdate) {
              const cacheAge = Date.now() - parseInt(lastUpdate)
              const fiveMinutes = 5 * 60 * 1000 // 5 minutos em ms
              
              if (cacheAge < fiveMinutes) {
                cachedNotifications = JSON.parse(cached)
                cachedUnreadCount = cachedCount ? parseInt(cachedCount) : 0
                shouldUseCache = serverNotifications.length === 0 && cachedNotifications.length > 0
              }
            }
          } catch (error) {
            console.warn('Erro ao carregar cache:', error)
          }
        }
        
        // Decidir qual fonte usar
        const finalNotifications = serverNotifications.length > 0 
          ? serverNotifications 
          : shouldUseCache 
            ? cachedNotifications 
            : []
        
        setNotifications(finalNotifications)
        
        // Calcular contador de não lidas
        const finalUnreadCount = finalNotifications.filter(n => !n.read).length
        setUnreadCount(finalUnreadCount)
        
        console.log('✅ Notificações sincronizadas:', {
          servidor: serverNotifications.length,
          cache: cachedNotifications.length,
          useCache: shouldUseCache,
          final: finalNotifications.length,
          unread: finalUnreadCount
        })
      } catch (error) {
        console.error('❌ Erro inesperado ao buscar notificações:', error)
      } finally {
        // Sempre parar loading, mesmo em caso de erro
        setLoading(false)
      }
    }

    // Executar busca inicial
    fetchNotifications()
  }, [userId])

  // =====================================================
  // CONFIGURAÇÃO DE TEMPO REAL (WEBSOCKET)
  // =====================================================
  
  useEffect(() => {
    // Não configurar se não tiver userId válido
    if (!userId || userId.trim() === '') {
      console.warn('⚠️ Não configurando listener: userId inválido')
      return
    }

    /**
     * Configura listener em tempo real para novas notificações
     * Monitora inserções na tabela 'notifications' via WebSocket
     */
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('🔔 Nova notificação recebida:', payload.new)
        
        // Adicionar nova notificação no topo da lista
        const newNotification = payload.new as Notification
        setNotifications(prev => [newNotification, ...prev])
        
        // Incrementar contador de não lidas
        setUnreadCount(prev => prev + 1)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('📝 Notificação atualizada:', payload.new)
        
        // Atualizar notificação na lista local
        const updatedNotification = payload.new as Notification
        setNotifications(prev => 
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        )
        
        // Se foi marcada como lida, decrementar contador
        if (updatedNotification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      })
      .subscribe()

    console.log('📡 Listener de tempo real configurado para usuário:', userId)

    // Cleanup: remover channel ao desmontar
    return () => {
      console.log('🧹 Removendo listener de notificações')
      supabase.removeChannel(channel)
    }
  }, [userId])

  // =====================================================
  // LISTENER PARA RECARREGAMENTO MANUAL
  // =====================================================
  
  useEffect(() => {
    if (!userId || userId.trim() === '') return

    const handleRefetchEvent = async () => {
      console.log('🔄 Evento de refetch recebido')
      
      // Reimplementar a lógica aqui para evitar duplicação
      try {
        setLoading(true)
        console.log('🔄 Recarregando notificações...')
        
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        
        const serverNotifications = data || []
        setNotifications(serverNotifications)
        
        const unreadCount = serverNotifications.filter(n => !n.read).length
        setUnreadCount(unreadCount)
        
        console.log('✅ Notificações recarregadas via evento:', {
          total: serverNotifications.length,
          unread: unreadCount
        })
        
      } catch (error) {
        console.error('❌ Erro ao recarregar notificações:', error)
      } finally {
        setLoading(false)
      }
    }

    window.addEventListener('refetch-notifications', handleRefetchEvent)
    
    return () => {
      window.removeEventListener('refetch-notifications', handleRefetchEvent)
    }
  }, [userId])

  // =====================================================
  // FUNÇÕES PÚBLICAS DE CONTROLE
  // =====================================================

  /**
   * Força o recarregamento das notificações do servidor
   * Útil para sincronizar após navegação ou quando há problemas de cache
   */
  const refetchNotifications = async () => {
    if (!userId || userId.trim() === '') {
      console.warn('⚠️ Não é possível recarregar: usuário não autenticado')
      return
    }

    try {
      setLoading(true)
      console.log('🔄 Recarregando notificações...')
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const serverNotifications = data || []
      setNotifications(serverNotifications)
      
      const unreadCount = serverNotifications.filter(n => !n.read).length
      setUnreadCount(unreadCount)
      
      console.log('✅ Notificações recarregadas:', {
        total: serverNotifications.length,
        unread: unreadCount
      })
      
    } catch (error) {
      console.error('❌ Erro ao recarregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Marca uma notificação específica como lida
   * Atualiza tanto o banco quanto o estado local
   * 
   * @param notificationId ID da notificação a ser marcada
   */
  const markAsRead = async (notificationId: string) => {
    // Não executar se não estiver autenticado
    if (!userId || userId.trim() === '') {
      console.warn('⚠️ Não é possível marcar como lida: usuário não autenticado')
      return
    }

    try {
      console.log('📖 Marcando notificação como lida:', notificationId)
      
      // Atualizar estado local imediatamente para melhor UX
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        // Tratamento especial para coluna inexistente
        if (error.message?.includes('column "read" does not exist')) {
          console.log('⚠️ Coluna "read" não existe, operação ignorada')
          return
        }
        
        // Reverter mudança local em caso de erro
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
        )
        setUnreadCount(prev => prev + 1)
        
        throw error
      }
      
      console.log('✅ Notificação marcada como lida')
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error)
      throw new Error('Falha ao marcar notificação como lida')
    }
  }

  /**
   * Marca todas as notificações do usuário como lidas
   * Útil para botão "marcar todas como lidas"
   */
  const markAllAsRead = async () => {
    if (!userId || userId.trim() === '') {
      console.warn('⚠️ Não é possível marcar como lidas: usuário não autenticado')
      return
    }

    try {
      console.log('📖 Marcando todas as notificações como lidas...')
      
      // Atualizar estado local imediatamente para melhor UX  
      const previousNotifications = notifications
      const previousUnreadCount = unreadCount
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        // Tratamento para coluna inexistente
        if (error.message?.includes('column "read" does not exist')) {
          console.log('⚠️ Coluna "read" não existe, mantendo mudança local')
          return
        }
        
        // Reverter mudanças locais em caso de erro
        setNotifications(previousNotifications)
        setUnreadCount(previousUnreadCount)
        
        throw error
      }
      
      console.log('✅ Todas as notificações marcadas como lidas')
      
    } catch (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error)
      throw new Error('Falha ao marcar todas as notificações como lidas')
    }
  }

  // =====================================================
  // RETORNO DO HOOK
  // =====================================================

  return {
    /** Lista de todas as notificações do usuário (ordenadas por data) */
    notifications,
    
    /** Contador de notificações não lidas */
    unreadCount,
    
    /** Indica se ainda está carregando notificações iniciais */
    loading,
    
    /** Função para marcar uma notificação específica como lida */
    markAsRead,
    
    /** Função para marcar todas as notificações como lidas */
    markAllAsRead,

    /** Função para forçar recarregamento das notificações */
    refetchNotifications
  }
}