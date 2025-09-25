'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'
import { Navigation } from '@/components/Navigation'
import { AddBookForm } from '@/components/AddBookFormNew'
import { UserEvaluation } from '@/components/UserEvaluation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { MessageSquare, Clock, CheckCircle, XCircle, User, Calendar, BookOpen, Inbox, Send, Users } from 'lucide-react'
import Image from 'next/image'

interface ReceivedRequest {
  id: string
  status: 'pendente' | 'aceita' | 'recusada'
  message: string
  created_at: string
  book: {
    id: string
    title: string
    author: string
    image_url?: string
  }
  requester: {
    id: string
    display_name: string
    email: string
  }
}

interface SentRequest {
  id: string
  status: 'pendente' | 'aceita' | 'recusada'
  message: string
  created_at: string
  book: {
    id: string
    title: string
    author: string
    image_url?: string
  }
  owner: {
    id: string
    display_name: string
    email: string
  }
}

export default function RequestsPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [receivedRequests, setReceivedRequests] = useState<ReceivedRequest[]>([])
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [responding, setResponding] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('recebidas')

  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // Verificar se deve ir para aba enviadas (vindo do modal)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab === 'enviadas') {
      setActiveTab('enviadas')
    }
  }, [])

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadRequests()
      } else {
        setLoading(false)
      }
    }
  }, [user, authLoading])

  // Real-time listener para atualizações nas solicitações
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('requests_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'requests',
        filter: `or(requester_id.eq.${user.id},owner_id.eq.${user.id})`
      }, (payload) => {
        console.log('Real-time request change:', payload)
        loadRequests() // Recarregar solicitações quando houver mudanças
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const loadRequests = async () => {
    try {
      console.log('🔄 Carregando todas as solicitações para usuário:', user?.id)
      setLoading(true)
      
      await Promise.all([
        loadReceivedRequests(),
        loadSentRequests()
      ])
      
      console.log('✅ Solicitações carregadas com sucesso!')
      console.log('📊 Estado atual:', { 
        receivedCount: receivedRequests.length, 
        sentCount: sentRequests.length 
      })
    } catch (error) {
      console.error('Error loading requests:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar solicitações",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadReceivedRequests = async () => {
    try {
      console.log('Loading received requests for user:', user?.id)
      
      // Query mais simples e robusta
      const { data: requestsData, error } = await supabase
        .from('requests')
        .select(`
          id,
          status,
          message,
          created_at,
          book_id,
          requester_id,
          owner_id
        `)
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })

      console.log('Received requests query result:', { requestsData, error })
      
      if (error) {
        console.error('Error loading received requests:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar solicitações recebidas: " + error.message,
          variant: "destructive"
        })
        return
      }

      // Buscar dados relacionados separadamente para evitar problemas de JOIN
      const requestIds = (requestsData || []).map(req => req.id)
      const bookIds = (requestsData || []).map(req => req.book_id)
      const requesterIds = (requestsData || []).map(req => req.requester_id)

      // Buscar livros
      let booksData: any[] = []
      if (bookIds.length > 0) {
        const { data } = await supabase
          .from('books')
          .select('id, title, author, image_url')
          .in('id', bookIds)
        booksData = data || []
      }

      // Buscar perfis dos solicitantes
      let profilesData: any[] = []
      if (requesterIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', requesterIds)
        profilesData = data || []
      }
      
      const mappedRequests: ReceivedRequest[] = (requestsData || []).map((req: any) => {
        const book = booksData.find(b => b.id === req.book_id) || {}
        const requester = profilesData.find(p => p.id === req.requester_id) || {}
        
        return {
          id: req.id,
          status: req.status,
          message: req.message,
          created_at: req.created_at,
          book,
          requester
        }
      })
      
      console.log('Mapped received requests:', mappedRequests)
      setReceivedRequests(mappedRequests)
    } catch (error) {
      console.error('Error loading received requests:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar solicitações recebidas",
        variant: "destructive"
      })
    }
  }

  const loadSentRequests = async () => {
    try {
      console.log('📤 Loading SENT requests for user:', user?.id)
      
      if (!user?.id) {
        console.error('❌ Sem user ID para buscar solicitações enviadas')
        return
      }
      
      // Query mais simples
      const { data: requestsData, error } = await supabase
        .from('requests')
        .select(`
          id,
          status,
          message,
          created_at,
          book_id,
          owner_id,
          requester_id
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

      console.log('📤 Sent requests RAW query result:', { 
        requestsData, 
        error, 
        totalFound: requestsData?.length || 0,
        userId: user.id 
      })
      
      if (error) {
        console.error('❌ Error loading sent requests:', error)
        toast({
          title: "Erro",
          description: "Erro ao carregar solicitações enviadas: " + error.message,
          variant: "destructive"
        })
        return
      }

      if (!requestsData || requestsData.length === 0) {
        console.log('📤 Nenhuma solicitação enviada encontrada para o usuário:', user.id)
        setSentRequests([])
        return
      }

      console.log('📤 Found', requestsData.length, 'sent requests, processing...')

      // Buscar dados relacionados separadamente
      const bookIds = [...new Set(requestsData.map(req => req.book_id).filter(Boolean))]
      const ownerIds = [...new Set(requestsData.map(req => req.owner_id).filter(Boolean))]

      console.log('📤 Fetching related data:', { bookIds, ownerIds })

      // Buscar livros
      let booksData: any[] = []
      if (bookIds.length > 0) {
        const { data, error: bookError } = await supabase
          .from('books')
          .select('id, title, author, image_url')
          .in('id', bookIds)
        
        if (bookError) {
          console.error('❌ Error fetching books:', bookError)
        } else {
          booksData = data || []
          console.log('📚 Books fetched:', booksData.length)
        }
      }

      // Buscar proprietários
      let ownersData: any[] = []
      if (ownerIds.length > 0) {
        const { data, error: ownerError } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', ownerIds)
        
        if (ownerError) {
          console.error('❌ Error fetching owners:', ownerError)
        } else {
          ownersData = data || []
          console.log('👥 Owners fetched:', ownersData.length)
        }
      }
      
      const mappedRequests: SentRequest[] = requestsData.map((req: any) => {
        const book = booksData.find(b => b.id === req.book_id) || {
          id: req.book_id,
          title: 'Livro não encontrado',
          author: 'Desconhecido',
          image_url: null
        }
        const owner = ownersData.find(o => o.id === req.owner_id) || {
          id: req.owner_id,
          display_name: 'Usuário não encontrado',
          email: ''
        }
        
        return {
          id: req.id,
          status: req.status,
          message: req.message,
          created_at: req.created_at,
          book,
          owner
        }
      })
      
      console.log('📤 Final mapped SENT requests:', mappedRequests)
      console.log('📤 Atualizando estado setSentRequests com:', mappedRequests.length, 'itens')
      setSentRequests(mappedRequests)
      console.log('📤 Estado atualizado! Aguarde próximo render...')
    } catch (error) {
      console.error('❌ Error loading sent requests:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar solicitações enviadas",
        variant: "destructive"
      })
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  const respondToRequest = async (requestId: string, status: 'aceita' | 'recusada', message: string) => {
    setResponding(requestId)

    try {
      // Buscar dados da solicitação antes de atualizar
      const { data: requestData } = await supabase
        .from('requests')
        .select(`
          requester_id,
          books!inner (
            title
          )
        `)
        .eq('id', requestId)
        .single()

      const { error } = await supabase
        .from('requests')
        .update({
          status
        })
        .eq('id', requestId)

      if (error) {
        console.error('Error responding to request:', error)
        toast({
          title: "Erro",
          description: "Erro ao responder solicitação",
          variant: "destructive"
        })
        return
      }

      // Criar notificação para o requester
      if (requestData) {
        try {
          const notificationData = {
            user_id: requestData.requester_id,
            type: status === 'aceita' ? 'request_accepted' : 'request_rejected',
            title: `Solicitação ${status}`,
            message: `Sua solicitação do livro "${requestData.books?.[0]?.title}" foi ${status}. ${message ? 'Resposta: ' + message : ''}`
          }
          
          console.log('Criando notificação de resposta...', notificationData)
          
          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notificationData)
            
          if (notifError) {
            console.error('Erro ao criar notificação:', notifError)
          } else {
            console.log('Notificação de resposta criada com sucesso!')
          }
        } catch (notificationError) {
          console.error('Erro inesperado ao criar notificação:', notificationError)
        }
      }

      toast({
        title: "Sucesso!",
        description: `Solicitação ${status === 'aceita' ? 'aceita' : 'recusada'} com sucesso`,
      })

      await loadRequests()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Erro",
        description: "Erro inesperado ao responder",
        variant: "destructive"
      })
    } finally {
      setResponding(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      case 'aceita': return 'bg-green-100 text-green-800'
      case 'recusada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente'
      case 'aceita': return 'Aceita'
      case 'recusada': return 'Recusada'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="h-4 w-4" />
      case 'aceita': return <CheckCircle className="h-4 w-4" />
      case 'recusada': return <XCircle className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  // Debug para verificar estado no render
  console.log('🎨 RENDER - Estado atual:', {
    receivedRequests: receivedRequests.length,
    sentRequests: sentRequests.length,
    activeTab,
    loading,
    authLoading,
    sentRequestsArray: sentRequests
  })

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
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">Você precisa estar logado para ver suas solicitações.</p>
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
          <h1 className="text-3xl font-bold">Minhas Solicitações</h1>
        </div>

        <Tabs value={activeTab === 'enviadas' ? 'enviadas' : 'recebidas'} onValueChange={(value) => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recebidas" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recebidas ({receivedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="enviadas" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviadas ({sentRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recebidas" className="mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Solicitações Recebidas</h2>
              <p className="text-gray-600">Pessoas que querem pegar seus livros emprestados</p>
            </div>

            {receivedRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-6">
                  <Inbox className="mx-auto h-16 w-16 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma solicitação recebida</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Quando alguém solicitar empréstimo dos seus livros, as solicitações aparecerão aqui.
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>💡 Dica: Adicione mais livros para receber mais solicitações</p>
                  <p>📚 Compartilhe seus livros favoritos com outros leitores</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {receivedRequests.map((request) => (
                  <Card key={request.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <User className="h-10 w-10 text-gray-400 bg-gray-100 rounded-full p-2" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{request.requester?.display_name}</h3>
                            <p className="text-gray-600 text-sm">{request.requester?.email}</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(request.status)} border-0 flex items-center gap-1`}>
                          {getStatusIcon(request.status)}
                          {getStatusText(request.status)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        {request.book?.image_url ? (
                          <Image
                            src={request.book.image_url}
                            alt={request.book.title}
                            width={60}
                            height={80}
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="w-15 h-20 bg-gray-200 rounded flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium">{request.book?.title}</h4>
                          <p className="text-gray-600 text-sm">por {request.book?.author}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-700">{request.message}</p>
                      </div>



                      {request.status === 'pendente' && (
                        <div className="flex space-x-3 pt-3">
                          <Button
                            onClick={() => respondToRequest(request.id, 'aceita', 'Solicitação aceita! Vamos combinar os detalhes.')}
                            disabled={responding === request.id}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aceitar
                          </Button>
                          <Button
                            onClick={() => respondToRequest(request.id, 'recusada', 'Obrigado pelo interesse, mas não posso emprestar no momento.')}
                            disabled={responding === request.id}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Recusar
                          </Button>
                        </div>
                      )}

                      <div className="flex items-center text-xs text-gray-500 pt-2 border-t">
                        <Calendar className="h-3 w-3 mr-1" />
                        Solicitado em {new Date(request.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="enviadas" className="mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Solicitações Enviadas</h2>
              <p className="text-gray-600">Livros que você solicitou de outros usuários</p>
            </div>

            {sentRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-6">
                  <Send className="mx-auto h-16 w-16 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma solicitação enviada</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Você ainda não solicitou nenhum livro. Explore a biblioteca e encontre livros interessantes!
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>💡 Dica: Navegue pela página inicial para descobrir novos livros</p>
                  <p>📖 Solicite livros que deseja ler</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {sentRequests.map((request) => (
                  <Card key={request.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <User className="h-10 w-10 text-gray-400 bg-gray-100 rounded-full p-2" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">Para: {request.owner?.display_name}</h3>
                            <p className="text-gray-600 text-sm">{request.owner?.email}</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(request.status)} border-0 flex items-center gap-1`}>
                          {getStatusIcon(request.status)}
                          {getStatusText(request.status)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        {request.book?.image_url ? (
                          <Image
                            src={request.book.image_url}
                            alt={request.book.title}
                            width={60}
                            height={80}
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="w-15 h-20 bg-gray-200 rounded flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium">{request.book?.title}</h4>
                          <p className="text-gray-600 text-sm">por {request.book?.author}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Sua mensagem:</p>
                        <p className="text-gray-700">{request.message}</p>
                      </div>



                      <div className="flex items-center text-xs text-gray-500 pt-2 border-t">
                        <Calendar className="h-3 w-3 mr-1" />
                        Solicitado em {new Date(request.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {showAddForm && (
        <AddBookForm 
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}