/**
 * =====================================================
 * TIPOS TYPESCRIPT - BOOKEXCHANGE
 * Definições centralizadas de tipos para todo o projeto
 * =====================================================
 */

// =====================================================
// TIPOS BÁSICOS DO USUÁRIO
// =====================================================

/**
 * Representação de um usuário na plataforma
 * Corresponde à tabela 'profiles' no banco de dados
 */
export interface User {
  /** ID único do usuário (UUID do Supabase Auth) */
  id: string
  /** Email do usuário */
  email: string
  /** Nome de exibição escolhido pelo usuário */
  display_name: string
  /** URL do avatar/foto de perfil (opcional) */
  avatar_url?: string
  /** Biografia/descrição do usuário (opcional) */
  bio?: string
  /** Data de criação do perfil */
  created_at: string
  /** Data da última atualização do perfil */
  updated_at: string
}

// =====================================================
// TIPOS RELACIONADOS A LIVROS
// =====================================================

/**
 * Representação de um livro na plataforma
 * Corresponde à tabela 'books' no banco de dados
 */
export interface Book {
  /** ID único do livro (UUID) */
  id: string
  /** Título do livro */
  title: string
  /** Nome do autor */
  author: string
  /** Descrição/sinopse do livro */
  description: string
  /** Categoria/gênero do livro */
  category: string
  /** URL da imagem da capa (opcional) */
  image_url?: string
  /** ID do proprietário do livro */
  owner_id: string
  /** Data de adição do livro */
  created_at: string
  /** Data da última atualização */
  updated_at: string
  
  // Relacionamentos (carregados via JOIN)
  /** Dados do proprietário do livro */
  owner?: User
  /** Locais de encontro configurados para este livro */
  meeting_locations?: MeetingLocation[]
}

/**
 * Local de encontro para troca de um livro específico
 * Corresponde à tabela 'meeting_locations' no banco de dados
 */
export interface MeetingLocation {
  /** ID único do local (UUID) */
  id: string
  /** ID do livro ao qual este local pertence */
  book_id: string
  /** Descrição do local (ex: "Shopping Center - Praça de Alimentação") */
  location: string
  /** Data de criação do local */
  created_at: string
}

// =====================================================
// TIPOS DO SISTEMA DE SOLICITAÇÕES
// =====================================================

/**
 * Status possíveis de uma solicitação de troca
 */
export type RequestStatus = 'pending' | 'accepted' | 'rejected'

/**
 * Solicitação de troca de livro
 * Corresponde à tabela 'requests' no banco de dados
 */
export interface BookRequest {
  /** ID único da solicitação (UUID) */
  id: string
  /** ID do usuário que está solicitando o livro */
  requester_id: string
  /** ID do proprietário do livro */
  owner_id: string
  /** ID do livro solicitado */
  book_id: string
  /** Mensagem enviada pelo solicitante */
  message: string
  /** Status atual da solicitação */
  status: RequestStatus
  /** Data de criação da solicitação */
  created_at: string
  /** Data da última atualização */
  updated_at: string
  
  // Relacionamentos (carregados via JOIN)
  /** Dados do usuário que está solicitando */
  requester?: User
  /** Dados do proprietário do livro */
  owner?: User
  /** Dados do livro solicitado */
  book?: Book
}

// =====================================================
// TIPOS DO SISTEMA DE NOTIFICAÇÕES
// =====================================================

/**
 * Tipos de notificação disponíveis na plataforma
 */
export type NotificationType = 
  | 'book_request'      // Nova solicitação de livro recebida
  | 'request_accepted'  // Solicitação foi aceita
  | 'request_rejected'  // Solicitação foi recusada
  | 'new_message'       // Nova mensagem recebida
  | 'system'            // Notificação do sistema

/**
 * Notificação para o usuário
 * Corresponde à tabela 'notifications' no banco de dados
 */
export interface Notification {
  /** ID único da notificação (UUID) */
  id: string
  /** ID do usuário que receberá a notificação */
  user_id: string
  /** Tipo da notificação */
  type: NotificationType
  /** Título da notificação */
  title: string
  /** Conteúdo/corpo da mensagem */
  message: string
  /** Se a notificação foi lida pelo usuário */
  read?: boolean
  /** Dados adicionais em formato JSON (opcional) */
  data?: {
    /** ID da solicitação relacionada (se aplicável) */
    request_id?: string
    /** ID do livro relacionado (se aplicável) */
    book_id?: string
    /** ID do usuário que gerou a notificação */
    requester_id?: string
    /** Nome do usuário que gerou a notificação */
    requester_name?: string
    /** Mensagem adicional do proprietário */
    owner_message?: string
  }
  /** Data de criação da notificação */
  created_at: string
}

// =====================================================
// TIPOS PARA AUTENTICAÇÃO
// =====================================================

/**
 * Context de autenticação da aplicação
 * Define os métodos disponíveis para gerenciar autenticação
 */
export interface AuthContextType {
  /** Usuário atualmente logado (null se não logado) */
  user: User | null
  /** Se está carregando dados de autenticação */
  loading: boolean
  /** Função para fazer login */
  signIn: (email: string, password: string) => Promise<any>
  /** Função para registrar novo usuário */
  signUp: (email: string, password: string, displayName: string) => Promise<any>
  /** Função para fazer logout */
  signOut: () => Promise<void>
  /** Função para atualizar dados do perfil */
  updateProfile: (data: Partial<User>) => Promise<void>
}

// =====================================================
// TIPOS PARA FORMULÁRIOS
// =====================================================

/**
 * Dados do formulário de livro (para criação/edição)
 */
export interface BookFormData {
  /** Título do livro */
  title: string
  /** Nome do autor */
  author: string
  /** Descrição do livro */
  description: string
  /** Categoria selecionada */
  category: string
  /** URL da imagem da capa */
  image_url: string
  /** Lista de locais de encontro */
  meeting_locations: string[]
}

/**
 * Dados do formulário de solicitação de livro
 */
export interface RequestFormData {
  /** Mensagem para o proprietário do livro */
  message: string
}

/**
 * Dados do formulário de perfil de usuário
 */
export interface ProfileFormData {
  /** Nome de exibição */
  display_name: string
  /** URL do avatar */
  avatar_url?: string
  /** Biografia do usuário */
  bio?: string
}

// =====================================================
// TIPOS PARA HOOKS
// =====================================================

/**
 * Retorno do hook useBooks
 */
export interface UseBooksReturn {
  /** Lista de livros */
  books: Book[]
  /** Se está carregando */
  loading: boolean
  /** Mensagem de erro (se houver) */
  error: string | null
  /** Função para recarregar os livros */
  refetch: () => Promise<void>
}

/**
 * Retorno do hook useRequests
 */
export interface UseRequestsReturn {
  /** Solicitações recebidas pelo usuário */
  receivedRequests: BookRequest[]
  /** Solicitações enviadas pelo usuário */
  sentRequests: BookRequest[]
  /** Se está carregando */
  loading: boolean
  /** Função para atualizar status de uma solicitação */
  updateRequestStatus: (requestId: string, status: RequestStatus) => Promise<boolean>
  /** Função para recarregar as solicitações */
  refetch: () => Promise<void>
}

/**
 * Retorno do hook useNotifications
 */
export interface UseNotificationsReturn {
  /** Lista de notificações */
  notifications: Notification[]
  /** Se está carregando */
  loading: boolean
  /** Quantidade de notificações não lidas */
  unreadCount: number
  /** Função para marcar uma notificação como lida */
  markAsRead: (notificationId: string) => Promise<void>
  /** Função para marcar todas as notificações como lidas */
  markAllAsRead: () => Promise<void>
  /** Função para recarregar as notificações */
  refetch: () => Promise<void>
}

// =====================================================
// TIPOS PARA COMPONENTES
// =====================================================

/**
 * Props para componentes de botão
 */
export interface ButtonProps {
  /** Variante visual do botão */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  /** Tamanho do botão */
  size?: 'sm' | 'md' | 'lg'
  /** Se o botão está carregando */
  loading?: boolean
  /** Se o botão está desabilitado */
  disabled?: boolean
  /** Classe CSS adicional */
  className?: string
  /** Conteúdo do botão */
  children: React.ReactNode
  /** Função executada ao clicar */
  onClick?: () => void
}

/**
 * Props para componentes de input
 */
export interface InputProps {
  /** Label do campo */
  label?: string
  /** Mensagem de erro */
  error?: string
  /** Texto de ajuda */
  helperText?: string
  /** Placeholder */
  placeholder?: string
  /** Valor do input */
  value?: string
  /** Função executada quando o valor muda */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** Tipo do input */
  type?: 'text' | 'email' | 'password' | 'url' | 'number'
  /** Se o campo é obrigatório */
  required?: boolean
  /** Classe CSS adicional */
  className?: string
}

// =====================================================
// CONSTANTES DE TIPOS
// =====================================================

/**
 * Status de solicitação como constantes
 */
export const REQUEST_STATUS = {
  PENDING: 'pending' as const,
  ACCEPTED: 'accepted' as const,
  REJECTED: 'rejected' as const,
} as const

/**
 * Tipos de notificação como constantes
 */
export const NOTIFICATION_TYPES = {
  BOOK_REQUEST: 'book_request' as const,
  REQUEST_ACCEPTED: 'request_accepted' as const,
  REQUEST_REJECTED: 'request_rejected' as const,
  NEW_MESSAGE: 'new_message' as const,
  SYSTEM: 'system' as const,
} as const