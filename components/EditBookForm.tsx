import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X, MapPin, BookOpen } from 'lucide-react'

interface EditBookFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  book: any
}

export function EditBookForm({ isOpen, onClose, onSuccess, book }: EditBookFormProps) {
  const { user } = useAuth()
  const supabase = createClientComponentClient()
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: ''
  })
  const [imageUrl, setImageUrl] = useState('')
  const [meetingLocations, setMeetingLocations] = useState<string[]>([''])
  const [newLocation, setNewLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = [
    'Literatura Brasileira',
    'Literatura Estrangeira', 
    'Ficção Científica',
    'Fantasia',
    'Romance',
    'Suspense/Thriller',
    'História',
    'Biografia',
    'Autoajuda',
    'Tecnologia',
    'Ciência',
    'Psicologia',
    'Filosofia',
    'Arte',
    'Culinária',
    'Esportes',
    'Infantil',
    'Jovem Adulto',
    'Educação',
    'Negócios',
    'Outro'
  ]

  useEffect(() => {
    if (book && isOpen) {
      console.log('Loading book data for editing:', book)
      
      setFormData({
        title: book.title || '',
        author: book.author || '',
        description: book.description || '',
        category: book.category || ''
      })
      setImageUrl(book.image_url || '')
      
      // Load existing meeting locations - com mais segurança
      console.log('Meeting locations from book:', book.meeting_locations)
      let locations: string[] = []
      
      if (book.meeting_locations && Array.isArray(book.meeting_locations)) {
        locations = book.meeting_locations.map((loc: any) => 
          typeof loc === 'string' ? loc : loc.location || ''
        ).filter((loc: string) => loc.trim())
      }
      
      // Se não tiver locais ou estiver vazio, adicionar um campo vazio
      if (locations.length === 0) {
        locations = ['']
      }
      
      console.log('Setting meeting locations:', locations)
      setMeetingLocations(locations)
    }
  }, [book, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const addLocation = () => {
    if (newLocation.trim()) {
      setMeetingLocations(prev => [...prev, newLocation.trim()])
      setNewLocation('')
    }
  }

  const removeLocation = (index: number) => {
    setMeetingLocations(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) newErrors.title = 'Título é obrigatório'
    if (!formData.author.trim()) newErrors.author = 'Autor é obrigatório'
    if (!formData.description.trim()) newErrors.description = 'Descrição é obrigatória'
    if (!formData.category) newErrors.category = 'Categoria é obrigatória'
    
    const validLocations = meetingLocations.filter(loc => loc.trim())
    if (validLocations.length === 0) newErrors.locations = 'Adicione pelo menos um local de encontro'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      // Verificação robusta de autenticação
      console.log('Verificando autenticação...')
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar sessão atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('Sessão expirada. Faça logout e login novamente.')
      }

      console.log('Usuário autenticado:', {
        userId: user.id,
        email: user.email,
        sessionValid: !!session
      })

      console.log('Updating book:', book.id)

      // Update book
      const { error: bookError } = await supabase
        .from('books')
        .update({
          title: formData.title.trim(),
          author: formData.author.trim(),
          description: formData.description.trim(),
          category: formData.category || 'Literatura',
          image_url: imageUrl.trim() || null
        })
        .eq('id', book.id)

      if (bookError) throw bookError

      // Verificar se o usuário é realmente o dono do livro
      console.log('Verificando propriedade do livro...')
      const { data: bookCheck, error: bookCheckError } = await supabase
        .from('books')
        .select('owner_id')
        .eq('id', book.id)
        .single()

      if (bookCheckError || !bookCheck || bookCheck.owner_id !== user.id) {
        throw new Error('Você não tem permissão para editar este livro')
      }

      // Processar locais de encontro apenas se houver mudanças
      const validLocations = meetingLocations.filter((loc: string) => loc.trim())
      console.log('Locais válidos para salvar:', validLocations)
      
      // Buscar locais existentes
      const { data: existingLocations } = await supabase
        .from('meeting_locations')
        .select('location')
        .eq('book_id', book.id)

      const existingLocationNames = existingLocations?.map(loc => loc.location) || []
      console.log('Locais existentes:', existingLocationNames)

      // Só atualizar se houver diferença
      const locationsChanged = 
        validLocations.length !== existingLocationNames.length ||
        !validLocations.every(loc => existingLocationNames.includes(loc))

      if (locationsChanged) {
        console.log('Locais mudaram, atualizando...')
        
        // Delete existing meeting locations
        const { error: deleteError } = await supabase
          .from('meeting_locations')
          .delete()
          .eq('book_id', book.id)

        if (deleteError) {
          console.error('Erro ao deletar locais existentes:', deleteError)
          throw new Error(`Erro ao deletar locais existentes: ${deleteError.message}`)
        }

        // Insert new meeting locations
        if (validLocations.length > 0) {
          const locationInserts = validLocations.map(location => ({
            book_id: book.id,
            location: location.trim()
          }))

          console.log('Inserindo novos locais:', locationInserts)

          const { error: locationError } = await supabase
            .from('meeting_locations')
            .insert(locationInserts)

          if (locationError) {
            console.error('Erro detalhado ao inserir locais:', locationError)
            
            // Se for erro de RLS, dar uma mensagem mais específica
            if (locationError.message?.includes('row-level security')) {
              throw new Error('Erro de permissão: Execute novamente o script fix_meeting_locations_rls_v2.sql no Supabase')
            }
            
            throw new Error(`Erro ao inserir locais: ${locationError.message}`)
          }
          
          console.log('Locais inseridos com sucesso!')
        }
      } else {
        console.log('Locais não mudaram, mantendo os existentes')
      }

      console.log('Livro atualizado com sucesso')
      
      // Show success message
      alert('Livro atualizado com sucesso!')
      onSuccess()
      
    } catch (error: any) {
      console.error('Erro detalhado ao atualizar livro:', error)
      
      let errorMessage = error.message || 'Erro desconhecido ao atualizar livro'
      
      // Tratar diferentes tipos de erro
      if (error.message?.includes('row-level security')) {
        errorMessage = 'Erro de permissão: Execute o script fix_meeting_locations_rls_v2.sql no Supabase para corrigir as políticas de segurança.'
      } else if (error.message?.includes('network')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.'
      } else if (error.message?.includes('authentication')) {
        errorMessage = 'Sessão expirada. Faça logout e login novamente.'
      }
      
      setErrors({ general: errorMessage })
      
      // Também mostrar um alert para o usuário
      alert(`❌ ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Editar Livro</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                {errors.general}
              </div>
            )}

            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={errors.title ? 'border-red-500' : ''}
                placeholder="Ex: Dom Casmurro"
                required
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="author">Autor *</Label>
              <Input
                id="author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                className={errors.author ? 'border-red-500' : ''}
                placeholder="Ex: Machado de Assis"
                required
              />
              {errors.author && <p className="text-sm text-red-500 mt-1">{errors.author}</p>}
            </div>

            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select onValueChange={(value) => handleSelectChange('category', value)} value={formData.category}>
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
            </div>

            <div>
              <Label htmlFor="imageUrl">URL da Imagem (opcional)</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Ex: https://exemplo.com/imagem-do-livro.jpg"
              />
              <p className="text-sm text-gray-500 mt-1">
                Cole o link de uma imagem da capa do livro (opcional)
              </p>
              {imageUrl && (
                <div className="mt-2">
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="w-20 h-28 object-cover rounded border"
                    onError={() => setImageUrl('')}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={errors.description ? 'border-red-500' : ''}
                placeholder="Descreva o livro, seu estado, etc."
                rows={3}
                required
              />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
            </div>

            <div>
              <Label>Locais de Encontro *</Label>
              <div className="space-y-2">
                {meetingLocations.map((location, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={location}
                      onChange={(e) => {
                        const newLocations = [...meetingLocations]
                        newLocations[index] = e.target.value
                        setMeetingLocations(newLocations)
                      }}
                      placeholder="Ex: Shopping Center Norte"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeLocation(index)}
                      disabled={meetingLocations.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex space-x-2">
                  <Input
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Adicionar novo local"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addLocation}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {errors.locations && <p className="text-sm text-red-500 mt-1">{errors.locations}</p>}
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}