/**
 * =====================================================
 * HOOK DE SOLICITAÇÕES EM TEMPO REAL - BOOKEXCHANGE
 * Gerencia solicitações de livros com atualizações em tempo real
 * =====================================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

/** Interface para solicitações de livros */
export interface BookRequest {
  id: string
  book_id: string
  requester_id: string
  owner_id: string
  message: string
  meeting_location: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  
  /** Dados do livro relacionado */
  book?: {
    title: string
    author: string
  }
  
  /** Dados do solicitante */
  requester?: {
    name: string
    email: string
  }
}

/**
 * Hook para gerenciar solicitações de livros em tempo real
 * 
 * Funcionalidades:
 * - Busca solicitações onde o usuário é proprietário
 * - Monitora novas solicitações via WebSocket
 * - Permite aceitar/rejeitar solicitações
 * - Controla estados de loading
 * 
 * @param userId ID do usuário proprietário dos livros
 * @returns Objeto com solicitações e funções de controle
 */
export function useRealTimeRequests(userId: string) {
  /** Lista de solicitações do usuário */
  const [requests, setRequests] = useState<BookRequest[]>([])
  
  /** Estado de carregamento */
  const [loading, setLoading] = useState(true)

  /**
   * Busca solicitações onde o usuário é proprietário do livro
   */
  const fetchRequests = async () => {
    try {
      console.log('📋 Buscando solicitações para proprietário:', userId)
      
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          book:books(title, author),
          requester:profiles(name, email)
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setRequests(data || [])
      console.log('✅ Solicitações carregadas:', data?.length || 0)
      
    } catch (error) {
      console.error('❌ Erro ao buscar solicitações:', error)
    } finally {
      setLoading(false)
    }
  }

  // Create a new book request
  const createRequest = async (bookId: string, ownerId: string, message: string, meetingLocation: string) => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .insert({
          book_id: bookId,
          requester_id: userId,
          owner_id: ownerId,
          message: message.trim(),
          meeting_location: meetingLocation,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      // Create notification for the book owner
      await supabase
        .from('notifications')
        .insert({
          user_id: ownerId,
          type: 'book_request',
          title: 'Nova solicitação de empréstimo',
          message: `Alguém quer pedir emprestado seu livro. Mensagem: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
          read: false
        })

      return data
    } catch (error) {
      console.error('Erro ao criar solicitação:', error)
      throw error
    }
  }

  // Respond to a book request
  const respondToRequest = async (requestId: string, status: 'accepted' | 'rejected', ownerMessage?: string) => {
    try {
      // Update request status
      const { data: updatedRequest, error: updateError } = await supabase
        .from('requests')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select(`
          *,
          book:books(title, author),
          requester:profiles(name, email)
        `)
        .single()

      if (updateError) throw updateError

      // Create notification for the requester
      const notificationTitle = status === 'accepted' 
        ? 'Solicitação aceita!' 
        : 'Solicitação recusada'
      
      const notificationMessage = status === 'accepted'
        ? `Sua solicitação de empréstimo foi aceita! ${ownerMessage || ''}`
        : `Sua solicitação de empréstimo foi recusada. ${ownerMessage || ''}`

        await supabase
          .from('notifications')
          .insert({
            user_id: updatedRequest.requester_id,
            type: status === 'accepted' ? 'request_accepted' : 'request_rejected',
            title: notificationTitle,
            message: notificationMessage,
            read: false
          })

      return updatedRequest
    } catch (error) {
      console.error('Erro ao responder solicitação:', error)
      throw error
    }
  }

  // Set up real-time subscription
  useEffect(() => {
    fetchRequests()

    const channel = supabase
      .channel('requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
          filter: `owner_id=eq.${userId}`
        },
        (payload) => {
          console.log('Request change received:', payload)
          fetchRequests() // Re-fetch to get joined data
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return {
    requests,
    loading,
    createRequest,
    respondToRequest,
    refetch: fetchRequests
  }
}