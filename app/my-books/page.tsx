'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'
import { Navigation } from '@/components/Navigation'
import { AddBookForm } from '@/components/AddBookFormNew'
import { EditBookForm } from '@/components/EditBookForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { Pencil, Trash2, Plus, MapPin, BookOpen, MessageCircle, Heart } from 'lucide-react'
import Image from 'next/image'

interface Book {
  id: string
  title: string
  author: string
  description: string
  category: string
  availability_status: string
  image_url: string | null
  created_at: string
  meeting_locations: { id: string; location: string }[]
}

export default function MyBooksPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadMyBooks(user.id)
      } else {
        setLoading(false)
      }
    }
  }, [user, authLoading])



  const loadMyBooks = async (userId: string) => {
    try {
      console.log('Loading books for user:', userId)
      
      const { data: booksData, error } = await supabase
        .from('books')
        .select(`
          id,
          title,
          author,
          description,
          category,
          availability_status,
          image_url,
          created_at,
          meeting_locations (
            id,
            location
          )
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      console.log('Books query result:', { booksData, error })

      if (error) {
        console.error('Error loading books:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar seus livros",
          variant: "destructive"
        })
        return
      }

      console.log('Setting books:', booksData)
      setBooks(booksData || [])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar livros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Tem certeza que deseja excluir este livro?')) {
      return
    }

    setDeleting(bookId)

    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId)

      if (error) {
        console.error('Error deleting book:', error)
        toast({
          title: "Erro",
          description: "Erro ao excluir livro",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Sucesso!",
        description: "Livro excluído com sucesso",
      })

      // Remove book from state
      setBooks(prev => prev.filter(book => book.id !== bookId))
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir",
        variant: "destructive"
      })
    } finally {
      setDeleting(null)
    }
  }

  const handleBookAdded = () => {
    setShowAddForm(false)
    if (user) {
      loadMyBooks(user.id) // Reload the books list
    }
  }

  const handleEditBook = (book: Book) => {
    setEditingBook(book)
    setShowEditForm(true)
  }

  const handleBookEdited = () => {
    setShowEditForm(false)
    setEditingBook(null)
    if (user) {
      loadMyBooks(user.id) // Reload the books list
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'requested': return 'bg-yellow-100 text-yellow-800'
      case 'exchanged': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponível'
      case 'requested': return 'Com Solicitações'
      case 'exchanged': return 'Trocado'
      default: return status
    }
  }

  if (authLoading || loading) {
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">Você precisa estar logado para ver seus livros.</p>
            <Button onClick={() => router.push('/')} className="w-full">
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation 
        userId={user.id}
        onAddBook={() => setShowAddForm(true)}
        onLogout={handleLogout}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Meus Livros</h1>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Livro
          </Button>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-medium text-gray-900 mb-3">Sua biblioteca está vazia</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Comece adicionando seus livros favoritos e conecte-se com outros leitores da comunidade!
            </p>
            <Button onClick={() => setShowAddForm(true)} size="lg" className="mb-6">
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Meu Primeiro Livro
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm text-gray-500">
              <div className="text-center">
                <div className="bg-blue-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <p className="font-medium">Adicione seus livros</p>
                <p className="text-xs">Cadastre livros que você tem</p>
              </div>
              <div className="text-center">
                <div className="bg-green-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-medium">Receba solicitações</p>
                <p className="text-xs">Outros usuários podem pedir emprestado</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
                <p className="font-medium">Compartilhe conhecimento</p>
                <p className="text-xs">Ajude a comunidade a crescer</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              {books.length} {books.length === 1 ? 'livro cadastrado' : 'livros cadastrados'}
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {books.map((book) => (
                <Card key={book.id} className="overflow-hidden">
                  <div className="aspect-[3/4] relative">
                    {book.image_url ? (
                      <Image
                        src={book.image_url}
                        alt={book.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={`${getStatusColor(book.availability_status)} border-0`}>
                        {getStatusText(book.availability_status)}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-8 w-8"
                          title="Editar livro"
                          onClick={() => handleEditBook(book)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Excluir livro"
                          disabled={deleting === book.id}
                          onClick={() => handleDeleteBook(book.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">{book.title}</h3>
                    <p className="text-gray-600 mb-2">por {book.author}</p>
                    
                    {book.category && (
                      <Badge variant="outline" className="mb-3">
                        {book.category}
                      </Badge>
                    )}
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{book.description}</p>
                    
                    {book.meeting_locations && book.meeting_locations.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Locais de encontro:
                        </p>
                        {book.meeting_locations.slice(0, 2).map((location) => (
                          <p key={location.id} className="text-xs text-gray-600 pl-4">
                            • {location.location}
                          </p>
                        ))}
                        {book.meeting_locations.length > 2 && (
                          <p className="text-xs text-gray-500 pl-4">
                            +{book.meeting_locations.length - 2} outros...
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Add Book Form Modal */}
      {showAddForm && (
        <AddBookForm 
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onSuccess={handleBookAdded}
        />
      )}

      {/* Edit Book Form Modal */}
      {showEditForm && editingBook && (
        <EditBookForm 
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false)
            setEditingBook(null)
          }}
          onSuccess={handleBookEdited}
          book={editingBook}
        />
      )}
    </div>
  )
}