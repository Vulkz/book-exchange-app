import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X, MapPin, BookOpen } from 'lucide-react'

interface AddBookFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddBookForm({ isOpen, onClose, onSuccess }: AddBookFormProps) {
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
    'Outros'
  ]

  const conditions = [
    'Novo',
    'Muito Bom', 
    'Bom',
    'Regular',
    'Precisa de Reparos'
  ]





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

  const addMeetingLocation = () => {
    if (newLocation.trim() && !meetingLocations.includes(newLocation.trim())) {
      setMeetingLocations(prev => [...prev.filter(loc => loc.trim()), newLocation.trim()])
      setNewLocation('')
    }
  }

  const removeMeetingLocation = (index: number) => {
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      console.log('Inserting book for user:', user.id)
      console.log('Book data:', formData)

      // Insert book
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .insert({
          title: formData.title.trim(),
          author: formData.author.trim(),
          description: formData.description.trim(),
          category: formData.category || 'Literatura',
          owner_id: user.id,
          availability_status: 'available',
          image_url: imageUrl.trim() || null
        })
        .select()
        .single()

      console.log('Book insert result:', { bookData, bookError })
      if (bookError) throw bookError

      // Insert meeting locations
      const validLocations = meetingLocations.filter(loc => loc.trim())
      if (validLocations.length > 0) {
        const locationInserts = validLocations.map(location => ({
          book_id: bookData.id,
          location: location.trim()
        }))

        const { error: locationError } = await supabase
          .from('meeting_locations')
          .insert(locationInserts)

        if (locationError) throw locationError
      }

      // Reset form
      setFormData({
        title: '',
        author: '', 
        description: '',
        category: ''
      })
      setImageUrl('')
      setMeetingLocations([''])
      setNewLocation('')
      setErrors({})

      console.log('Livro criado com sucesso:', bookData)
      
      // Show success message
      alert('Livro adicionado com sucesso!')
      onSuccess()
      
    } catch (error: any) {
      console.error('Erro detalhado ao adicionar livro:', error)
      setErrors({ general: `Erro ao adicionar livro: ${error.message || 'Tente novamente.'}` })
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
              <span>Adicionar Livro</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Descreva o livro, sua condição, temas principais..."
                rows={3}
                required
              />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
            </div>

            <div>
              <Label className="flex items-center space-x-2 mb-2">
                <MapPin className="h-4 w-4" />
                <span>Locais de Encontro *</span>
              </Label>
              
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Ex: Biblioteca Central, Café do Centro..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addMeetingLocation()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addMeetingLocation}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {meetingLocations.filter(loc => loc.trim()).map((location, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Badge variant="secondary" className="flex-1 justify-start">
                      <MapPin className="h-3 w-3 mr-1" />
                      {location}
                    </Badge>
                    <Button
                      type="button"
                      onClick={() => removeMeetingLocation(index)}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {errors.locations && <p className="text-sm text-red-500 mt-1">{errors.locations}</p>}
            </div>

            {errors.general && <p className="text-sm text-red-500">{errors.general}</p>}

            <div className="flex space-x-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Adicionando...' : 'Adicionar Livro'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}