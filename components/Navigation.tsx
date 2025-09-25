'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, User, Library, MessageCircle, Bell } from 'lucide-react'
import { NotificationCenter } from '@/components/NotificationCenter'

interface NavigationProps {
  userId: string
  onAddBook: () => void
  onLogout: () => void
}

export function Navigation({ userId, onAddBook, onLogout }: NavigationProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' || pathname === ''
    }
    return pathname.startsWith(path)
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-4 hover:opacity-80">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">BookShare</h1>
            </Link>
            
            <div className="flex items-center space-x-4">
              <NotificationCenter userId={userId} />
              <Button
                onClick={onAddBook}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Adicionar Livro
              </Button>
              <Link href="/profile">
                <Button variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  Perfil
                </Button>
              </Link>
              <Button variant="outline" onClick={onLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link 
              href="/"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive('/') && !pathname.includes('/my-books') && !pathname.includes('/profile')
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Explorar Livros</span>
              </div>
            </Link>
            
            <Link 
              href="/my-books"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive('/my-books')
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Library className="h-4 w-4" />
                <span>Meus Livros</span>
              </div>
            </Link>
            
            <Link 
              href="/requests"
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive('/requests')
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <span>Solicitações</span>
              </div>
            </Link>
            
            <div className="py-4 px-1 border-b-2 border-transparent text-gray-400 font-medium text-sm cursor-not-allowed">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span>Chat</span>
                <Badge variant="secondary" className="text-xs">
                  Em breve
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}