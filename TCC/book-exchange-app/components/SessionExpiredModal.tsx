'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, LogOut } from 'lucide-react'

export function SessionExpiredModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { signOut } = useAuth()

  if (!isOpen) return null

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center text-red-600">Sessão Expirada</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Sua sessão expirou. Para continuar usando o sistema, você precisa fazer login novamente.
          </p>
          
          <div className="flex flex-col space-y-2">
            <Button onClick={handleRefresh} variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Recarregar
            </Button>
            
            <Button onClick={handleSignOut} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Fazer Login Novamente
            </Button>
          </div>
          
          <button 
            onClick={onClose}
            className="text-sm text-gray-500 underline"
          >
            Fechar
          </button>
        </CardContent>
      </Card>
    </div>
  )
}