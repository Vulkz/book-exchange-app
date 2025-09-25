'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'
import { Navigation } from '@/components/Navigation'
import { BookRequestModal } from '@/components/BookRequestModal'
import { AddBookForm } from '@/components/AddBookFormNew'
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
import Image from 'next/image'
import { SupabaseConnectionTest } from '@/components/SupabaseConnectionTest'

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

export default function HomePage() {
  // Use global auth context
  const { user, session, loading: authLoading, signOut } = useAuth()
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
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('')

  const supabase = createClientComponentClient()

  // Real-time hooks (only when user is authenticated)
  const { books: availableBooks, loading: booksLoading } = useRealTimeBooks()
  const { createRequest } = useRealTimeRequests(user?.id || '')

  // Load profile when user changes
  useEffect(() => {
    if (user) {
      fetchProfile(user.id)
    } else {
      setProfile(null)
    }
  }, [user])

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

      console.log('Login attempt result:', {
        success: !error,
        error: error?.message,
        session: data.session ? {
          user_id: data.session.user?.id,
          expires_at: data.session.expires_at,
          access_token: data.session.access_token ? 'presente' : 'ausente'
        } : null
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

  // Handle book request
  const handleBookRequest = (book: any) => {
    if (!user) {
      alert('Você precisa estar logado para solicitar livros!')
      return
    }
    setSelectedBook(book)
    setIsRequestModalOpen(true)
  }

  // Handle logout
  const handleLogout = async () => {
    await signOut()
  }

  // Handle book added
  const handleBookAdded = () => {
    setShowAddForm(false)
    // Books will be refreshed automatically via real-time hook
  }

  // Filter books based on search term
  const filteredBooks = availableBooks.filter(book => {
    if (!searchTerm.trim()) return true
    
    const search = searchTerm.toLowerCase()
    return (
      book.title.toLowerCase().includes(search) ||
      book.author.toLowerCase().includes(search) ||
      book.description.toLowerCase().includes(search) ||
      book.category.toLowerCase().includes(search) ||
      book.owner?.display_name.toLowerCase().includes(search)
    )
  })

  if (authLoading) {
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
      <Navigation 
        userId={user.id}
        onAddBook={() => setShowAddForm(true)}
        onLogout={handleLogout}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Livros Disponíveis</h2>
            {searchTerm.trim() && (
              <p className="text-sm text-gray-600 mt-1">
                {filteredBooks.length} resultado{filteredBooks.length !== 1 ? 's' : ''} para "{searchTerm}"
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar por título, autor, categoria..."
              className="w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm.trim() && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSearchTerm('')}
                className="text-gray-500"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>

        {booksLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm.trim() ? 'Nenhum livro encontrado' : 'Nenhum livro disponível'}
            </h3>
            <p className="text-gray-500">
              {searchTerm.trim() 
                ? `Não encontramos livros para "${searchTerm}". Tente outros termos.`
                : 'Seja o primeiro a adicionar um livro!'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                <div className="aspect-[3/4] relative">
                  {book.image_url ? (
                    <Image
                      src={book.image_url}
                      alt={book.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-blue-500" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white/90 text-gray-700 shadow-sm">
                      {book.category || 'Livro'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">{book.title}</h3>
                  <p className="text-gray-600 mb-2">por {book.author}</p>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{book.description}</p>
                  
                  {book.owner && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {book.owner.display_name?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600">{book.owner.display_name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Proprietário: {book.owner?.display_name || 'Usuário'}
                      </div>
                    </div>
                  )}

                  {book.meeting_locations && book.meeting_locations.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center text-gray-500 text-xs mb-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        Locais de encontro:
                      </div>
                      <p className="text-xs text-gray-600">
                        {book.meeting_locations.slice(0, 2).join(', ')}
                        {book.meeting_locations.length > 2 && ` +${book.meeting_locations.length - 2}`}
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={() => handleBookRequest(book)} 
                    className="w-full"
                    size="sm"
                    disabled={!user}
                    title={!user ? "Faça login para solicitar livros" : undefined}
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    {!user ? "Faça login para solicitar" : "Solicitar"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </main>

      {/* Book Request Modal */}
      {selectedBook && (
        <BookRequestModal
          book={selectedBook}
          isOpen={isRequestModalOpen}
          onClose={() => {
            setIsRequestModalOpen(false)
            setSelectedBook(null)
          }}
          onRequestSent={() => {
            setIsRequestModalOpen(false)
            setSelectedBook(null)
          }}
        />
      )}
      
      {/* Add Book Form Modal */}
      {showAddForm && (
        <AddBookForm 
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onSuccess={handleBookAdded}
        />
      )}
    </div>
  )
}
