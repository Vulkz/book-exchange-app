'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { AddBookForm } from '@/components/AddBookFormNew'
import { BookRequestModal } from '@/components/BookRequestModal'
import { NotificationCenter } from '@/components/NotificationCenter'
import { useRealTimeBooks } from '@/hooks/useRealTimeBooks'
import { useRealTimeRequests } from '@/hooks/useRealTimeRequests'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BookOpen, Users, Heart, Search, Plus, MapPin, MessageCircle, Gift, Sparkles } from 'lucide-react'
import type { User, Session } from '@supabase/supabase-js'

// Simple validation functions
const validateLoginData = (data: { email: string; password: string }) => {
  const errors: Record<string, string> = {}
  
  if (!data.email) errors.email = 'Email é obrigatório'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Email inválido'
  
  if (!data.password) errors.password = 'Senha é obrigatória'
  else if (data.password.length < 6) errors.password = 'Senha deve ter pelo menos 6 caracteres'
  
  return { success: Object.keys(errors).length === 0, errors }
}

const validateRegisterData = (data: { name: string; email: string; password: string; confirmPassword: string }) => {
  const errors: Record<string, string> = {}
  
  if (!data.name) errors.name = 'Nome é obrigatório'
  else if (data.name.length < 2) errors.name = 'Nome deve ter pelo menos 2 caracteres'
  
  if (!data.email) errors.email = 'Email é obrigatório'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Email inválido'
  
  if (!data.password) errors.password = 'Senha é obrigatória'
  else if (data.password.length < 6) errors.password = 'Senha deve ter pelo menos 6 caracteres'
  
  if (!data.confirmPassword) errors.confirmPassword = 'Confirmação de senha é obrigatória'
  else if (data.password !== data.confirmPassword) errors.confirmPassword = 'Senhas não coincidem'
  
  return { success: Object.keys(errors).length === 0, errors }
}

export default function BookShareApp() {
  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  // Form states
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Book request modal state
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

  // Add book form state
  const [showAddBookForm, setShowAddBookForm] = useState(false)

  // Real-time hooks (only when user is authenticated)
  const { books: availableBooks, loading: booksLoading } = useRealTimeBooks()
  const { createRequest } = useRealTimeRequests(user?.id || '')

  // Initialize auth
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session)
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Profile not found, will be created on first interaction')
        } else {
          throw error
        }
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      const validation = validateLoginData(formData)
      if (!validation.success) {
        setErrors(validation.errors)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        setErrors({ general: error.message })
      } else {
        console.log('Login successful:', data)
        setFormData({ email: '', password: '', name: '', confirmPassword: '' })
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ general: 'Erro inesperado. Tente novamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      const validation = validateRegisterData(formData)
      if (!validation.success) {
        setErrors(validation.errors)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          }
        }
      })

      if (error) {
        setErrors({ general: error.message })
      } else {
        console.log('Registration successful:', data)
        if (data.user && !data.session) {
          alert('Verifique seu email para confirmar sua conta!')
        }
        setFormData({ email: '', password: '', name: '', confirmPassword: '' })
      }
    } catch (error) {
      console.error('Registration error:', error)
      setErrors({ general: 'Erro inesperado. Tente novamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Handle book request
  const handleBookRequest = (book: any) => {
    setSelectedBook(book)
    setIsRequestModalOpen(true)
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

  // Login/Register form for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-blue-600 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">BookShare</CardTitle>
            <CardDescription>
              {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(value) => setIsLogin(value === 'login')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Registrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={errors.email ? 'border-red-500' : ''}
                      required
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={errors.password ? 'border-red-500' : ''}
                      required
                    />
                    {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                  </div>
                  {errors.general && <p className="text-sm text-red-500">{errors.general}</p>}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={errors.name ? 'border-red-500' : ''}
                      required
                    />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={errors.email ? 'border-red-500' : ''}
                      required
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={errors.password ? 'border-red-500' : ''}
                      required
                    />
                    {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={errors.confirmPassword ? 'border-red-500' : ''}
                      required
                    />
                    {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
                  </div>
                  {errors.general && <p className="text-sm text-red-500">{errors.general}</p>}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Registrando...' : 'Registrar'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main application for authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">BookShare</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter userId={user.id} />
              <Button
                onClick={() => setShowAddBookForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Livro
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/profile'}
              >
                Perfil
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="explore" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="explore">Explorar Livros</TabsTrigger>
            <TabsTrigger value="my-books" onClick={() => window.location.href = '/my-books'}>
              Meus Livros
            </TabsTrigger>
            <TabsTrigger value="requests">Solicitações</TabsTrigger>
            <TabsTrigger value="chat">
              Chat
              <div className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Em breve
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Explore Books */}
          <TabsContent value="explore" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Livros Disponíveis</h2>
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar livros..."
                  className="w-64"
                />
              </div>
            </div>

            {booksLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : availableBooks.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum livro disponível</h3>
                <p className="text-gray-500">Seja o primeiro a adicionar um livro!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {availableBooks.map((book) => (
                  <Card key={book.id} className="hover:shadow-lg transition-shadow">
                    <div className="aspect-[3/4] bg-gray-100 rounded-t-lg flex items-center justify-center">
                      {book.image_url ? (
                        <img 
                          src={book.image_url} 
                          alt={book.title}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      ) : (
                        <BookOpen className="h-16 w-16 text-gray-400" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary">{book.category}</Badge>
                        <div className="text-sm text-gray-600">
                          Proprietário: {book.owner?.display_name || 'Usuário'}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{book.owner?.location || 'Local não informado'}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{book.description}</p>
                      <Button 
                        onClick={() => handleBookRequest(book)}
                        className="w-full"
                        disabled={book.owner_id === user?.id}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {book.owner_id === user?.id ? 'Seu livro' : 'Solicitar'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Books */}
          <TabsContent value="my-books">
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Seus Livros</h3>
              <p className="text-gray-500 mb-6">Gerencie sua coleção de livros</p>
              <Button onClick={() => setShowAddBookForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Livro
              </Button>
            </div>
          </TabsContent>

          {/* Requests */}
          <TabsContent value="requests">
            <div className="text-center py-12">
              <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Solicitações</h3>
              <p className="text-gray-500">Suas solicitações de empréstimo aparecerão aqui</p>
            </div>
          </TabsContent>

          {/* Chat */}
          <TabsContent value="chat">
            <div className="text-center py-16">
              <div className="relative inline-block">
                <MessageCircle className="h-24 w-24 text-blue-300 mx-auto mb-6" />
                <Sparkles className="h-8 w-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                <h3 className="text-3xl font-bold mb-4">Chat em Tempo Real</h3>
                <p className="text-xl text-gray-600 font-medium">Em breve</p>
              </div>
              <div className="mt-8 p-6 bg-white rounded-xl shadow-sm border border-blue-100 max-w-md mx-auto">
                <p className="text-gray-600">
                  Estamos preparando um sistema de chat incrível para você conversar 
                  diretamente com outros usuários sobre os livros!
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Book Form Modal */}
      <AddBookForm
        isOpen={showAddBookForm}
        onClose={() => setShowAddBookForm(false)}
        onSuccess={() => {
          setShowAddBookForm(false)
          // Books will refresh automatically via real-time subscription
        }}
      />

      {/* Book Request Modal */}
      {selectedBook && (
        <BookRequestModal
          isOpen={isRequestModalOpen}
          onClose={() => {
            setIsRequestModalOpen(false)
            setSelectedBook(null)
          }}
          book={selectedBook}
          onRequestSent={() => {
            setIsRequestModalOpen(false)
            setSelectedBook(null)
          }}
        />
      )}
    </div>
  )
}