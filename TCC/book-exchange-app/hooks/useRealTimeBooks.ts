/**
 * =====================================================
 * HOOK DE LIVROS EM TEMPO REAL - BOOKEXCHANGE
 * Gerencia livros disponíveis com atualizações em tempo real
 * =====================================================
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

/** Interface para estrutura de livros */
export interface Book {
  id: string
  owner_id: string
  title: string
  author: string
  description: string
  category: string
  availability_status: string
  meeting_locations: string[]
  image_url: string
  created_at: string
  owner?: {
    display_name: string
    location: string
  }
}

/** Interface para solicitações de livros */
export interface BookRequest {
  id: string
  book_id: string
  requester_id: string
  message: string
  meeting_location_id: string
  status: 'pending' | 'accepted' | 'rejected'
  response_message?: string
  created_at: string
  responded_at?: string
  book?: Book
  requester?: {
    display_name: string
    email: string
  }
  meeting_location?: {
    name: string
    description: string
    address: string
  }
}

/**
 * Hook para gerenciar livros disponíveis em tempo real
 * 
 * Funcionalidades:
 * - Busca livros disponíveis (exceto do usuário atual)
 * - Monitora mudanças em tempo real via WebSocket
 * - Filtra por status de disponibilidade
 * - Gerencia loading states
 * 
 * @returns Objeto com livros e estados de controle
 */
export function useRealTimeBooks() {
  /** Lista de livros disponíveis */
  const [books, setBooks] = useState<Book[]>([])
  
  /** Estado de carregamento */
  const [loading, setLoading] = useState(true)

  // =====================================================
  // BUSCA INICIAL DE LIVROS
  // =====================================================
  
  useEffect(() => {
    /**
     * Busca livros iniciais excluindo os do próprio usuário
     */
    const fetchBooks = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        const query = supabase
          .from('books')
          .select(`
            *,
            owner:profiles(display_name, location)
          `)
          .eq('availability_status', 'available')
          .order('created_at', { ascending: false })

        // If user is logged in, exclude their own books
        if (user) {
          query.neq('owner_id', user.id)
        }

        const { data, error } = await query

        if (error) throw error
        setBooks(data || [])
      } catch (error) {
        console.error('Erro ao buscar livros:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [])

  // Configurar realtime para livros
  useEffect(() => {
    const channel = supabase
      .channel('books')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'books'
      }, async (payload) => {
        const newBook = payload.new as Book
        // Get current user to exclude their own books
        const { data: { user } } = await supabase.auth.getUser()
        
        if (newBook.availability_status === 'available' && newBook.owner_id !== user?.id) {
          setBooks(prev => [newBook, ...prev])
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'books'
      }, async (payload) => {
        const updatedBook = payload.new as Book
        const { data: { user } } = await supabase.auth.getUser()
        
        setBooks(prev => 
          prev.map(book => 
            book.id === updatedBook.id ? updatedBook : book
          ).filter(book => book.availability_status === 'available' && book.owner_id !== user?.id)
        )
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'books'
      }, (payload) => {
        const deletedBook = payload.old as Book
        setBooks(prev => prev.filter(book => book.id !== deletedBook.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return {
    books,
    loading,
    refreshBooks: () => {
      setLoading(true)
      // Re-fetch books
    }
  }
}

export function useRealTimeRequests(userId?: string) {
  const [requests, setRequests] = useState<BookRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Buscar solicitações iniciais (recebidas e enviadas)
  useEffect(() => {
    if (!userId) return

    const fetchRequests = async () => {
      try {
        // Solicitações recebidas (usuário é dono do livro)
        const { data: receivedRequests, error: receivedError } = await supabase
          .from('requests')
          .select(`
            *,
            book:books(*),
            requester:profiles(display_name, email),
            meeting_location:meeting_locations(name, description, address)
          `)
          .eq('book.owner_id', userId)

        if (receivedError) throw receivedError

        // Solicitações enviadas (usuário é solicitante)
        const { data: sentRequests, error: sentError } = await supabase
          .from('requests')
          .select(`
            *,
            book:books(*, owner:profiles(display_name)),
            meeting_location:meeting_locations(name, description, address)
          `)
          .eq('requester_id', userId)

        if (sentError) throw sentError

        const allRequests = [...(receivedRequests || []), ...(sentRequests || [])]
        setRequests(allRequests)
      } catch (error) {
        console.error('Erro ao buscar solicitações:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [userId])

  // Configurar realtime para requests
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'requests'
      }, (payload) => {
        const newRequest = payload.new as BookRequest
        // Adicionar apenas se o usuário está envolvido
        if (newRequest.requester_id === userId) {
          setRequests(prev => [newRequest, ...prev])
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'requests'
      }, (payload) => {
        const updatedRequest = payload.new as BookRequest
        setRequests(prev => 
          prev.map(req => 
            req.id === updatedRequest.id ? updatedRequest : req
          )
        )
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const createRequest = async (bookId: string, message: string, meetingLocationId: string) => {
    if (!userId) throw new Error('Usuário não autenticado')

    try {
      const { data, error } = await supabase
        .from('requests')
        .insert({
          book_id: bookId,
          requester_id: userId,
          message: message,
          meeting_location_id: meetingLocationId,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao criar solicitação:', error)
      throw error
    }
  }

  const respondToRequest = async (requestId: string, status: 'accepted' | 'rejected', responseMessage?: string) => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .update({
          status,
          response_message: responseMessage,
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao responder solicitação:', error)
      throw error
    }
  }

  return {
    requests,
    loading,
    createRequest,
    respondToRequest
  }
}