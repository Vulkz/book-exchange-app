/**
 * =====================================================
 * TIPOS SUPABASE - BOOKEXCHANGE
 * Tipos gerados automaticamente pelo Supabase CLI
 * =====================================================
 */

/**
 * Definição do schema do banco de dados
 * Estes tipos correspondem às tabelas e suas colunas no Supabase
 */
export interface Database {
  public: {
    Tables: {
      /** Tabela de perfis de usuários */
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      /** Tabela de livros */
      books: {
        Row: {
          id: string
          title: string
          author: string
          description: string
          category: string
          image_url: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          author: string
          description: string
          category: string
          image_url?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          author?: string
          description?: string
          category?: string
          image_url?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      
      /** Tabela de locais de encontro */
      meeting_locations: {
        Row: {
          id: string
          book_id: string
          location: string
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          location: string
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          location?: string
          created_at?: string
        }
      }
      
      /** Tabela de solicitações */
      requests: {
        Row: {
          id: string
          requester_id: string
          owner_id: string
          book_id: string
          message: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          owner_id: string
          book_id: string
          message: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          owner_id?: string
          book_id?: string
          message?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      
      /** Tabela de notificações */
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          read: boolean | null
          data: any | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          read?: boolean | null
          data?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          read?: boolean | null
          data?: any | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}