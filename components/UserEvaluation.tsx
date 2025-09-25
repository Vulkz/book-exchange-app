import React, { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Star, Flag, AlertTriangle } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface UserEvaluationProps {
  bookRequest: {
    id: string
    book: {
      title: string
      owner: {
        id: string
        display_name: string
      }
    }
    requester: {
      id: string
      display_name: string
    }
    status: string
  }
  currentUserId: string
}

export function UserEvaluation({ bookRequest, currentUserId }: UserEvaluationProps) {
  const { user } = useAuth()
  const supabase = createClientComponentClient()
  
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reportType, setReportType] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [loading, setLoading] = useState(false)

  // Determinar quem o usuário atual vai avaliar
  const otherUser = currentUserId === bookRequest.book.owner.id 
    ? bookRequest.requester 
    : bookRequest.book.owner

  const reportTypes = [
    { value: 'inappropriate_behavior', label: 'Comportamento inadequado' },
    { value: 'no_show', label: 'Não compareceu ao encontro' },
    { value: 'damaged_book', label: 'Livro danificado' },
    { value: 'late_return', label: 'Devolução atrasada' },
    { value: 'other', label: 'Outro' }
  ]

  const handleRatingSubmit = async () => {
    if (!user || rating === 0) {
      toast({
        title: "Erro",
        description: "Selecione uma avaliação",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('user_ratings')
        .insert({
          rater_id: currentUserId,
          rated_user_id: otherUser.id,
          book_request_id: bookRequest.id,
          rating,
          comment: comment.trim() || null
        })

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Avaliação já existe",
            description: "Você já avaliou este usuário para esta troca",
            variant: "destructive"
          })
        } else {
          throw error
        }
        return
      }

      toast({
        title: "Sucesso!",
        description: "Avaliação enviada com sucesso"
      })

      setShowRatingModal(false)
      setRating(0)
      setComment('')
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast({
        title: "Erro",
        description: "Erro ao enviar avaliação",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReportSubmit = async () => {
    if (!user || !reportType || !reportDescription.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: currentUserId,
          reported_user_id: otherUser.id,
          book_request_id: bookRequest.id,
          report_type: reportType,
          description: reportDescription.trim()
        })

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Report já existe",
            description: "Você já reportou este usuário para esta troca",
            variant: "destructive"
          })
        } else {
          throw error
        }
        return
      }

      toast({
        title: "Sucesso!",
        description: "Report enviado com sucesso. Nossa equipe irá analisar."
      })

      setShowReportModal(false)
      setReportType('')
      setReportDescription('')
    } catch (error) {
      console.error('Error submitting report:', error)
      toast({
        title: "Erro",
        description: "Erro ao enviar report",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Só mostrar se o pedido foi aceito (troca completada)
  if (bookRequest.status !== 'accepted') {
    return null
  }

  return (
    <div className="flex space-x-2 mt-4">
      {/* Botão de Avaliação */}
      <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center space-x-1">
            <Star className="h-4 w-4" />
            <span>Avaliar</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Avaliar {otherUser.display_name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Avaliação para a troca do livro: {bookRequest.book.title}</Label>
              <div className="flex items-center space-x-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <Star className="h-6 w-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="comment">Comentário (opcional)</Label>
              <Textarea
                id="comment"
                placeholder="Deixe um comentário sobre a experiência..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={handleRatingSubmit} 
                disabled={rating === 0 || loading}
                className="flex-1"
              >
                {loading ? 'Enviando...' : 'Enviar Avaliação'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowRatingModal(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Botão de Report */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center space-x-1 text-red-600 hover:text-red-700">
            <Flag className="h-4 w-4" />
            <span>Reportar</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Reportar {otherUser.display_name}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Motivo do report para a troca: {bookRequest.book.title}</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reportDescription">Descrição *</Label>
              <Textarea
                id="reportDescription"
                placeholder="Descreva o que aconteceu..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                Os reports são analisados pela nossa equipe. Use esta função apenas para situações que realmente violam as regras da plataforma.
              </p>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={handleReportSubmit} 
                disabled={!reportType || !reportDescription.trim() || loading}
                variant="destructive"
                className="flex-1"
              >
                {loading ? 'Enviando...' : 'Enviar Report'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowReportModal(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}