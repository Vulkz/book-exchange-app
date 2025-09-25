/**
 * =====================================================
 * LAYOUT AUTENTICADO - BOOKEXCHANGE
 * Layout principal para usuários autenticados
 * =====================================================
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Navigation } from '@/components/Navigation'
import { AddBookForm } from '@/components/AddBookFormNew'
import { User } from '@supabase/auth-helpers-nextjs'
import { BookOpen } from 'lucide-react'

/** Props do componente AuthenticatedLayout */
interface AuthenticatedLayoutProps {
  /** Conteúdo a ser renderizado dentro do layout */
  children: React.ReactNode
}

/**
 * Layout principal para páginas que requerem autenticação
 * 
 * Funcionalidades:
 * - Verifica se usuário está autenticado
 * - Redireciona para login se não autenticado
 * - Fornece navegação e header
 * - Inclui formulário de adicionar livro
 * - Gerencia logout do usuário
 * - Monitora mudanças de autenticação
 * 
 * @param children Conteúdo das páginas filhas
 * @returns Layout com navegação e proteção de autenticação
 * 
 * @example
 * ```tsx
 * <AuthenticatedLayout>
 *   <div>Conteúdo protegido aqui</div>
 * </AuthenticatedLayout>
 * ```
 */
export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  // =====================================================
  // ESTADOS E CONFIGURAÇÕES
  // =====================================================
  
  /** Usuário atualmente autenticado */
  const [user, setUser] = useState<User | null>(null)
  
  /** Estado de carregamento da verificação de autenticação */
  const [loading, setLoading] = useState(true)
  
  /** Controla exibição do formulário de adicionar livro */
  const [showAddBookForm, setShowAddBookForm] = useState(false)
  
  // Hooks do Next.js e Supabase
  const router = useRouter()
  const supabase = createClientComponentClient()

  // =====================================================
  // VERIFICAÇÃO DE AUTENTICAÇÃO
  // =====================================================
  
  useEffect(() => {
    /**
     * Verifica se usuário está autenticado
     * Redireciona para login se não estiver
     */
    const checkAuth = async () => {
      console.log('🔐 Verificando autenticação...')
      
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      
      if (!user) {
        console.log('❌ Usuário não autenticado - redirecionando')
        router.push('/')
      } else {
        console.log('✅ Usuário autenticado:', user.email)
      }
    }

    // Executar verificação inicial
    checkAuth()

    /**
     * Listener para mudanças de estado de autenticação
     * Monitora login/logout em tempo real
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Mudança de autenticação:', event)
        
        setUser(session?.user ?? null)
        
        // Redirecionar se usuário fez logout
        if (!session?.user) {
          console.log('👋 Usuário deslogado - redirecionando')
          router.push('/')
        }
      }
    )

    // Cleanup: cancelar subscription
    return () => subscription.unsubscribe()
  }, [supabase, router])

  /**
   * Função para fazer logout do usuário
   * Remove sessão e redireciona para página inicial
   */
  const handleLogout = async () => {
    console.log('🚪 Fazendo logout...')
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleBookAdded = () => {
    setShowAddBookForm(false)
    // You might want to refresh the page or trigger a reload
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation 
        userId={user.id}
        onAddBook={() => setShowAddBookForm(true)}
        onLogout={handleLogout}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Add Book Form Modal */}
      {showAddBookForm && (
        <AddBookForm 
          isOpen={showAddBookForm}
          onClose={() => setShowAddBookForm(false)}
          onSuccess={handleBookAdded}
        />
      )}
    </div>
  )
}