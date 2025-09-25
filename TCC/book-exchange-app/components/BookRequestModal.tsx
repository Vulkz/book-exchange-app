import React, { useState, useEffect } from 'react'
import { X, MapPin, MessageSquare, Send } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface MeetingLocation {
  id: string
  name: string
  description: string
  address: string
}

interface BookRequestModalProps {
  isOpen: boolean
  onClose: () => void
  book: {
    id: string
    title: string
    author: string
    owner_id: string
    meeting_locations?: string[]
    owner?: {
      display_name: string
    }
  }
  onRequestSent: () => void
}

export function BookRequestModal({ isOpen, onClose, book, onRequestSent }: BookRequestModalProps) {
  const [message, setMessage] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [meetingLocations, setMeetingLocations] = useState<MeetingLocation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClientComponentClient()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  // Debug do estado da autenticação
  useEffect(() => {
    if (isOpen) {
      console.log('BookRequestModal - Estado da autenticação:', {
        user: user ? { id: user.id, email: user.email } : null,
        authLoading,
        isOpen
      })
    }
  }, [isOpen, user, authLoading])

  // Buscar locais de encontro
  useEffect(() => {
    if (isOpen) {
      fetchMeetingLocations()
    }
  }, [isOpen])

  const fetchMeetingLocations = async () => {
    try {
      // Buscar locais específicos do livro
      const { data, error } = await supabase
        .from('meeting_locations')
        .select('*')
        .eq('book_id', book.id)
        .order('location')

      if (error) throw error
      
      // Converter os dados para o formato esperado
      const locations = data?.map((loc: any) => ({
        id: loc.id,
        name: loc.location,
        description: loc.location,
        address: loc.location
      })) || []

      setMeetingLocations(locations)
    } catch (error) {
      console.error('Erro ao buscar locais de encontro:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (meetingLocations.length === 0) {
      setError('Este livro não possui locais de encontro definidos pelo proprietário')
      return
    }
    
    if (!message.trim() || !selectedLocation) {
      setError('Por favor, preencha todos os campos')
      return
    }

    if (message.length > 500) {
      setError('A mensagem deve ter no máximo 500 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('=== VERIFICAÇÃO RÁPIDA DE AUTENTICAÇÃO ===')
      
      // Verificação simples e rápida
      if (!user?.id) {
        throw new Error('Usuário não autenticado. Faça login novamente.')
      }

      // Verificar sessão atual uma vez só
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Erro na sessão:', sessionError)
        throw new Error('Erro de autenticação. Tente novamente.')
      }
      
      if (!session) {
        throw new Error('Sessão expirada. Faça logout e login novamente.')
      }
      
      console.log('✅ Usuário autenticado:', {
        userId: user.id,
        email: user.email,
        sessionExpires: session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'indefinido'
      })

      // Encontrar o nome do local selecionado
      const selectedLocationName = meetingLocations.find(loc => loc.id === selectedLocation)?.name || selectedLocation

      // Primeiro, tentar inserir com meeting_location_id
      let insertData: any = {
        book_id: book.id,
        requester_id: user.id,
        owner_id: book.owner_id,
        message: message.trim(),
        status: 'pendente'
      }
      
      console.log('Dados para inserção:', insertData)

      // Inserir solicitação com local na mensagem (mais simples e confiável)
      insertData.message = `${message.trim()}\n\n[Local preferido: ${selectedLocationName}]`
      
      console.log('📝 Inserindo solicitação na tabela requests...', insertData)
      
      const { data: insertResult, error: insertError } = await supabase
        .from('requests')
        .insert(insertData)
        .select()

      console.log('✅ Resultado da inserção em requests:', { 
        success: !insertError,
        data: insertResult, 
        error: insertError,
        insertData
      })
      
      if (insertError) {
        console.error('❌ Erro detalhado na inserção em requests:', insertError)
        
        // Verificar se o erro é específico de meeting_locations
        if (insertError.message?.includes('meeting_locations')) {
          console.error('🚨 ERRO EM MEETING_LOCATIONS - isso é estranho, não deveria estar criando meeting_locations aqui!')
          console.error('Dados que causaram o erro:', insertData)
          throw new Error('Erro inesperado: tentativa de criar meeting_locations durante solicitação de livro')
        }
        
        throw insertError
      }
      
      console.log('✅ Solicitação inserida com sucesso na tabela requests!')

      // Criar notificação para o dono do livro
      try {
        console.log('📧 Iniciando criação de notificação...')
        
        const requesterName = user.user_metadata?.display_name || 
                             user.user_metadata?.name || 
                             user.email?.split('@')[0] || 
                             'Usuário'
        
        const notificationData = {
          user_id: book.owner_id,
          type: 'book_request',
          title: 'Nova solicitação de livro',
          message: `${requesterName} solicitou o livro "${book.title}". Local preferido: ${selectedLocationName}`,
          read: false,
          data: {
            request_id: insertResult?.[0]?.id || null,
            book_id: book.id,
            requester_id: user.id,
            requester_name: requesterName
          }
        }
        
        console.log('📧 Inserindo notificação...', notificationData)
        
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notificationData)
          
        console.log('📧 Resultado da inserção de notificação:', {
          success: !notifError,
          error: notifError
        })
          
        if (notifError) {
          console.error('Erro ao criar notificação:', notifError)
        } else {
          console.log('✅ Notificação criada com sucesso!')
        }
      } catch (notificationError) {
        console.error('Erro inesperado ao criar notificação:', notificationError)
        // Não falha a operação principal se a notificação falhar
      }

      // Mostrar mensagem de sucesso
      alert('✅ Solicitação enviada com sucesso! Você será redirecionado para ver suas solicitações.')
      
      // Chamar callback e fechar modal
      onRequestSent()
      onClose()
      setMessage('')
      setSelectedLocation('')
      
      // Redirecionar para a página de solicitações enviadas
      console.log('Redirecionando para /requests?tab=enviadas...')
      setTimeout(() => {
        router.push('/requests?tab=enviadas')
      }, 500)
    } catch (error: any) {
      setError(error.message || 'Erro ao enviar solicitação')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setMessage('')
    setSelectedLocation('')
    setError('')
  }

  if (!isOpen) return null

  // Se ainda estiver carregando a autenticação ou usuário não autenticado
  if (authLoading || !user) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
          {authLoading ? (
            <div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Verificando autenticação...</p>
            </div>
          ) : (
            <div>
              <X className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Você precisa estar logado para solicitar livros.</p>
              <button 
                onClick={handleClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Solicitar Livro</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Book Info */}
        <div className="p-6 border-b bg-gray-50">
          <h3 className="font-semibold text-lg text-gray-900">{book.title}</h3>
          <p className="text-gray-600">por {book.author}</p>
          <p className="text-sm text-gray-500 mt-1">
            Dono: {book.owner?.display_name || 'Usuário'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Message Field */}
          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Mensagem para o dono do livro *
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Conte um pouco sobre você, por que está interessado neste livro, quando gostaria de pegá-lo emprestado..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              maxLength={500}
              required
            />
            <div className="flex justify-between mt-2">
              <p className="text-sm text-gray-500">
                Máximo 500 caracteres
              </p>
              <p className={`text-sm ${message.length > 450 ? 'text-red-500' : 'text-gray-500'}`}>
                {message.length}/500
              </p>
            </div>
          </div>

          {/* Meeting Location */}
          <div className="mb-6">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Local de encontro *
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Escolha um dos locais disponibilizados por {book.owner?.display_name || 'o proprietário'}:
            </p>
            {meetingLocations.length > 0 ? (
              <select
                id="location"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione um local</option>
                {meetingLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  O proprietário ainda não definiu locais de encontro para este livro.
                </p>
              </div>
            )}
            {selectedLocation && (
              <p className="text-sm text-blue-600 mt-2 p-2 bg-blue-50 rounded">
                📍 Local selecionado: {meetingLocations.find(l => l.id === selectedLocation)?.name}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
              {error.includes('sessão expirou') && (
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="mt-2 text-sm text-blue-600 underline hover:text-blue-800"
                >
                  Ir para a página de login
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !message.trim() || !selectedLocation || meetingLocations.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Enviar Solicitação</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Footer */}
        <div className="p-4 bg-blue-50 border-t">
          <p className="text-sm text-blue-800">
            <MessageSquare className="h-4 w-4 inline mr-1" />
            Sua solicitação será enviada ao dono do livro. Você receberá uma notificação quando ele responder.
          </p>
        </div>
      </div>
    </div>
  )
}