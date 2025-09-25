import React, { useState, useEffect } from 'react'
import { Bell, Check, X, MessageSquare, Calendar, MapPin, User } from 'lucide-react'
import { useRealTimeNotifications, Notification } from '@/hooks/useRealTimeNotifications'
import { useRealTimeRequests } from '@/hooks/useRealTimeRequests'
import { toast } from '@/components/ui/use-toast'

interface NotificationCenterProps {
  userId: string
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useRealTimeNotifications(userId)
  const { respondToRequest } = useRealTimeRequests(userId)
  const [isOpen, setIsOpen] = useState(false)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [lastNotificationCount, setLastNotificationCount] = useState(0)

  // Verificar se o usuário está autenticado
  const isAuthenticated = userId && userId.trim() !== ''

  // Debug logs
  useEffect(() => {
    console.log('🔔 NotificationCenter - Estado atual:', {
      userId,
      isAuthenticated,
      notifications: notifications.length,
      unreadCount,
      loading
    })
  }, [userId, isAuthenticated, notifications.length, unreadCount, loading])

  // Detectar quando a página fica visível novamente (usuário volta da navegação)
  useEffect(() => {
    if (!isAuthenticated) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 Página ficou visível - verificando notificações...')
        // Pequeno delay para garantir que o estado foi restaurado
        setTimeout(() => {
          if (notifications.length === 0) {
            console.log('🔄 Notificações vazias após navegação - recarregando...')
            // Vamos usar um evento customizado para triggerar um refetch
            window.dispatchEvent(new CustomEvent('refetch-notifications'))
          }
        }, 100)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated, notifications.length])

  // Toast para novas notificações - TODOS OS TIPOS
  useEffect(() => {
    if (notifications.length > lastNotificationCount && lastNotificationCount > 0) {
      const newNotifications = notifications.slice(0, notifications.length - lastNotificationCount)
      newNotifications.forEach(notification => {
        if (!notification.read) {
          // Mostrar toast para TODOS os tipos de notificação
          let title = "🔔 Nova notificação!"
          let description = notification.message
          
          switch (notification.type) {
            case 'book_request':
            case 'new_request':
              title = "📚 Nova solicitação!"
              description = `${notification.data?.requester_name || 'Alguém'} quer pegar um livro emprestado`
              break
            case 'request_accepted':
              title = "✅ Solicitação aceita!"
              description = notification.message
              break
            case 'request_rejected':
              title = "❌ Solicitação recusada"
              description = notification.message
              break
            default:
              title = "🔔 " + notification.title
              description = notification.message
          }
          
          toast({
            title,
            description,
          })
        }
      })
    }
    setLastNotificationCount(notifications.length)
  }, [notifications, lastNotificationCount])

  const handleAcceptRequest = async (notification: Notification) => {
    if (!notification.data?.request_id) return
    
    setRespondingTo(notification.data.request_id)
    try {
      await respondToRequest(notification.data.request_id, 'accepted', 'Solicitação aceita! Vamos combinar os detalhes.')
      await markAsRead(notification.id)
      toast({
        title: "✅ Solicitação aceita!",
        description: "O usuário foi notificado sobre sua decisão.",
      })
    } catch (error) {
      console.error('Erro ao aceitar solicitação:', error)
      toast({
        title: "❌ Erro",
        description: "Não foi possível aceitar a solicitação.",
        variant: "destructive"
      })
    } finally {
      setRespondingTo(null)
    }
  }

  const handleRejectRequest = async (notification: Notification) => {
    if (!notification.data?.request_id) return
    
    setRespondingTo(notification.data.request_id)
    try {
      await respondToRequest(notification.data.request_id, 'rejected', 'Obrigado pelo interesse, mas não posso emprestar no momento.')
      await markAsRead(notification.id)
      toast({
        title: "❌ Solicitação recusada",
        description: "O usuário foi notificado sobre sua decisão.",
      })
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error)
      toast({
        title: "❌ Erro",
        description: "Não foi possível recusar a solicitação.",
        variant: "destructive"
      })
    } finally {
      setRespondingTo(null)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'book_request':
      case 'new_request':
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case 'request_accepted':
        return <Check className="h-5 w-5 text-green-500" />
      case 'request_rejected':
        return <X className="h-5 w-5 text-red-500" />
      case 'message':
        return <MessageSquare className="h-5 w-5 text-purple-500" />
      case 'meeting':
        return <Calendar className="h-5 w-5 text-orange-500" />
      case 'location':
        return <MapPin className="h-5 w-5 text-indigo-500" />
      case 'user':
        return <User className="h-5 w-5 text-teal-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Agora'
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`
    return `${Math.floor(diffInMinutes / 1440)}d atrás`
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors ${
          isAuthenticated 
            ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' 
            : 'text-gray-400 cursor-not-allowed'
        }`}
        title={!isAuthenticated ? "Faça login para ver notificações" : "Notificações"}
        disabled={!isAuthenticated}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && isAuthenticated && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown - Versão Compacta */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-hidden">
          {/* Header Compacto */}
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-gray-600" />
              <h3 className="font-medium text-gray-900 text-sm">Notificações</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Notifications List Compacta */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                Carregando...
              </div>
            ) : !isAuthenticated ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Faça login para ver notificações</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50 border-l-3 border-l-blue-500' : ''
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate leading-tight">
                            {notification.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-tight">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex flex-col items-end ml-2">
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(notification.created_at)}
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Compactos para Book Requests */}
                      {(notification.type === 'book_request' || notification.type === 'new_request') && !notification.read && (
                        <div className="flex space-x-1 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAcceptRequest(notification)
                            }}
                            disabled={respondingTo === notification.data?.request_id}
                            className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center space-x-1"
                          >
                            <Check className="h-3 w-3" />
                            <span>Aceitar</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRejectRequest(notification)
                            }}
                            disabled={respondingTo === notification.data?.request_id}
                            className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center justify-center space-x-1"
                          >
                            <X className="h-3 w-3" />
                            <span>Recusar</span>
                          </button>
                        </div>
                      )}

                      {/* Additional Info Compacta para Accepted/Rejected Requests */}
                      {notification.type === 'request_accepted' && notification.data?.owner_message && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-800">
                          <MessageSquare className="h-3 w-3 inline mr-1" />
                          {notification.data.owner_message}
                        </div>
                      )}
                      {notification.type === 'request_rejected' && notification.data?.owner_message && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-800">
                          <MessageSquare className="h-3 w-3 inline mr-1" />
                          {notification.data.owner_message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Compacto */}
          {notifications.length > 3 && (
            <div className="p-2 bg-gray-50 text-center border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}