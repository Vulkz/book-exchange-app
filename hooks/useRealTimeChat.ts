/**
 * =====================================================
 * HOOK DE CHAT EM TEMPO REAL - BOOKEXCHANGE
 * Gerencia conversas e mensagens com atualizações em tempo real
 * =====================================================
 */

"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

/**
 * Interface para estrutura de mensagens do chat
 */
type Message = {
  /** ID único da mensagem */
  id: string
  
  /** ID da conversa à qual a mensagem pertence */
  conversation_id: string
  
  /** ID do usuário que enviou a mensagem */
  sender_id: string
  
  /** Conteúdo da mensagem */
  content: string
  
  /** Data/hora de criação */
  created_at: string
  
  /** Dados do remetente */
  sender: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

/**
 * Interface para estrutura de conversas
 */
type Conversation = {
  /** ID único da conversa */
  id: string
  
  /** ID do primeiro usuário */
  user1_id: string
  
  /** ID do segundo usuário */
  user2_id: string
  
  /** ID do livro (opcional - para conversas sobre livros específicos) */
  book_id?: string
  
  /** ID da solicitação (opcional - para conversas sobre solicitações) */
  request_id?: string
  
  /** Data de criação */
  created_at: string
  
  /** Data da última atualização */
  updated_at: string
  
  /** Lista de mensagens da conversa */
  messages: Message[]
  
  /** Dados do livro (se aplicável) */
  book?: {
    id: string
    title: string
  }
  
  /** Dados da solicitação (se aplicável) */
  request?: {
    id: string
  }
}

/**
 * Hook para gerenciar chat em tempo real
 * 
 * Funcionalidades:
 * - Busca conversas do usuário
 * - Monitora novas mensagens via WebSocket
 * - Permite envio de mensagens
 * - Controla loading states
 * - Gerencia múltiplas conversas simultaneamente
 * 
 * @returns Objeto com conversas, mensagens, funções de controle e estados
 * 
 * @example
 * ```typescript
 * function ChatComponent() {
 *   const { conversations, messages, sendMessage, loading } = useRealTimeChat()
 *   
 *   if (loading) return <div>Carregando conversas...</div>
 *   
 *   return (
 *     <div>
 *       {conversations.map(conv => (
 *         <div key={conv.id}>
 *           <h3>Conversa sobre: {conv.book?.title}</h3>
 *           {conv.messages.map(msg => (
 *             <p key={msg.id}>{msg.sender.full_name}: {msg.content}</p>
 *           ))}
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useRealTimeChat() {
  // =====================================================
  // ESTADOS LOCAIS
  // =====================================================
  
  /** Lista de todas as conversas do usuário */
  const [conversations, setConversations] = useState<Conversation[]>([])
  
  /** Lista de mensagens (pode ser filtrada por conversa) */
  const [messages, setMessages] = useState<Message[]>([])
  
  /** Indica se está carregando dados iniciais */
  const [loading, setLoading] = useState(true)

  // =====================================================
  // BUSCA INICIAL DE CONVERSAS
  // =====================================================
  
  useEffect(() => {
    fetchConversations()
  }, [])

  // =====================================================
  // CONFIGURAÇÃO DE TEMPO REAL (WEBSOCKET)
  // =====================================================
  
  useEffect(() => {
    /**
     * Configura listeners em tempo real para mensagens e conversas
     * Monitora mudanças via WebSocket para atualizações instantâneas
     */
    
    // Canal para monitorar novas mensagens
    const messagesChannel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("💬 Nova mensagem recebida:", payload.new)
          handleNewMessage(payload.new as Message)
        },
      )
      .subscribe()

    // Canal para monitorar mudanças em conversas
    const conversationsChannel = supabase
      .channel("conversations")
      .on(
        "postgres_changes",
        {
          event: "*", // Monitora INSERT, UPDATE, DELETE
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          console.log("🔄 Conversa atualizada:", payload)
          // Recarregar todas as conversas para manter sincronização
          fetchConversations()
        },
      )
      .subscribe()

    console.log("📡 Listeners de chat configurados")

    // Cleanup: remover channels ao desmontar
    return () => {
      console.log("🧹 Removendo listeners de chat")
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(conversationsChannel)
    }
  }, [])

  // =====================================================
  // FUNÇÕES INTERNAS AUXILIARES
  // =====================================================

  /**
   * Busca todas as conversas do usuário com dados relacionados
   * Inclui mensagens, informações do livro e da solicitação
   */
  const fetchConversations = async () => {
    try {
      console.log("📞 Buscando conversas do usuário...")
      
      const { data, error } = await supabase
        .from("conversations")
        .select("*, messages(*), book(id, title), request(id)")
        .order("created_at", { ascending: false })
        
      if (error) throw error
      
      const conversations = data || []
      setConversations(conversations)
      
      console.log("✅ Conversas carregadas:", conversations.length)
      
    } catch (error) {
      console.error("❌ Erro ao buscar conversas:", error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Busca mensagens de uma conversa específica
   * Usado para carregar histórico de mensagens
   * 
   * @param conversationId ID da conversa
   */
  const fetchMessages = async (conversationId: string) => {
    try {
      console.log("📨 Buscando mensagens da conversa:", conversationId)
      
      const response = await fetch(`/api/messages?conversationId=${conversationId}`)
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
        console.log("✅ Mensagens carregadas:", data.length)
      } else {
        console.error("❌ Erro na resposta da API:", response.status)
      }
    } catch (error) {
      console.error("❌ Erro ao buscar mensagens:", error)
    }
  }

  // =====================================================
  // FUNÇÕES PÚBLICAS
  // =====================================================

  /**
   * Envia uma nova mensagem para uma conversa
   * 
   * @param conversationId ID da conversa de destino
   * @param content Conteúdo da mensagem
   * @returns Promise que resolve quando a mensagem é enviada
   */
  const sendMessage = async (conversationId: string, content: string) => {
    try {
      console.log("📤 Enviando mensagem para conversa:", conversationId)
      
      // Validar autenticação
      const user = await supabase.auth.getUser()
      if (!user?.data?.user?.id) {
        throw new Error("Usuário não autenticado")
      }
      
      // Inserir mensagem no banco
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.data.user.id,
          content,
        })
        .select()
        .single()
        
      if (error) throw error
      
      // Adicionar mensagem à lista local (otimistic update)
      setMessages((prev) => [...prev, data])
      
      console.log("✅ Mensagem enviada com sucesso")
      
    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error)
      throw new Error("Falha ao enviar mensagem. Tente novamente.")
    }
  }

  /**
   * Processa nova mensagem recebida via WebSocket
   * Evita duplicatas e atualiza a lista local
   * 
   * @param newMessage Nova mensagem recebida
   */
  const handleNewMessage = (newMessage: Message) => {
    setMessages((prev) => {
      // Evitar mensagens duplicadas
      if (prev.some((msg) => msg.id === newMessage.id)) {
        console.log("⚠️ Mensagem duplicada ignorada:", newMessage.id)
        return prev
      }
      
      console.log("📨 Adicionando nova mensagem à lista")
      return [...prev, newMessage]
    })
  }

  // =====================================================
  // RETORNO DO HOOK
  // =====================================================

  return {
    /** Lista de todas as conversas do usuário com dados relacionados */
    conversations,
    
    /** Lista de mensagens da conversa atual (filtrada) */
    messages,
    
    /** Indica se ainda está carregando dados iniciais */
    loading,
    
    /** Função para buscar mensagens de uma conversa específica */
    fetchMessages,
    
    /** Função para enviar uma nova mensagem */
    sendMessage,
    
    /** Função para recarregar todas as conversas */
    fetchConversations,
  }
}
