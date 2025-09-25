"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Book = {
  id: number
  title: string
  author: string
  category: string
  condition: string
  description: string
  owner: string
  location: string
  rating: number
  image?: string
  available: boolean
}

export default function AddBookForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (book: Omit<Book, "id" | "owner" | "location" | "rating">) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    condition: "Bom",
    description: "",
    available: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const categories = [
    "Literatura Brasileira",
    "Ficção Científica",
    "Infantil",
    "História",
    "Tecnologia",
    "Romance",
    "Biografia",
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="author">Autor *</Label>
        <Input
          id="author"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="category">Categoria *</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
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
      </div>

      <div>
        <Label htmlFor="condition">Condição</Label>
        <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Excelente">Excelente</SelectItem>
            <SelectItem value="Bom">Bom</SelectItem>
            <SelectItem value="Regular">Regular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descreva o estado do livro, edição, etc."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex space-x-2">
        <Button type="submit" className="flex-1">
          Adicionar Livro
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
