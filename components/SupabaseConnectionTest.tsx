'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState('Verificando...')
  const [details, setDetails] = useState<string[]>([])
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function testConnection() {
      const results: string[] = []
      
      // 1. Verificar variáveis de ambiente
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      results.push(`✅ URL: ${url ? 'PRESENTE' : '❌ AUSENTE'}`)
      results.push(`✅ API Key: ${key ? 'PRESENTE' : '❌ AUSENTE'}`)
      
      if (!url || !key) {
        setStatus('❌ Variáveis de ambiente não configuradas')
        setDetails(results)
        return
      }
      
      try {
        // 2. Testar sessão
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          results.push(`❌ Erro na sessão: ${sessionError.message}`)
        } else {
          results.push(`✅ Sessão: ${session ? 'ATIVA' : 'INATIVA'}`)
          if (session) {
            results.push(`👤 Usuário: ${session.user.email}`)
          }
        }
        
        // 3. Testar query simples
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)
        
        if (error) {
          results.push(`❌ Erro na query: ${error.message}`)
          setStatus('❌ Erro de conexão com banco')
        } else {
          results.push('✅ Query de teste funcionou')
          setStatus('✅ Conexão funcionando!')
        }
        
      } catch (error: any) {
        results.push(`❌ Erro geral: ${error.message}`)
        setStatus('❌ Erro de conexão')
      }
      
      setDetails(results)
    }
    
    testConnection()
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-white border shadow-lg rounded-lg p-4 max-w-sm z-50">
      <h3 className="font-bold mb-2">🔍 Teste de Conexão Supabase</h3>
      <p className="mb-2">{status}</p>
      <div className="text-xs space-y-1">
        {details.map((detail, index) => (
          <div key={index}>{detail}</div>
        ))}
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
      >
        Recarregar
      </button>
    </div>
  )
}