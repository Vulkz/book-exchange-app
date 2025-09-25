/**
 * =====================================================
 * HOOK DE PROTEÇÃO CONTRA HARD REFRESH - BOOKEXCHANGE
 * Detecta hard refresh e preserva estado de autenticação
 * =====================================================
 */

'use client'

import { useEffect, useRef } from 'react'

/**
 * Hook para detectar hard refresh e preservar estado
 * 
 * Funcionalidades:
 * - Detecta hard refresh via Performance API
 * - Monitora combinações de teclas (Ctrl+F5, Alt+F5)
 * - Preserva estado de autenticação
 * - Evita logout indesejado em refreshes
 * 
 * @returns Objeto com informações sobre hard refresh
 * 
 * @example
 * ```typescript
 * function MyApp() {
 *   const { wasHardRefresh } = useHardRefreshProtection()
 *   
 *   useEffect(() => {
 *     if (wasHardRefresh) {
 *       console.log('Hard refresh detectado - mantendo usuário logado')
 *     }
 *   }, [wasHardRefresh])
 * }
 * ```
 */
export function useHardRefreshProtection() {
  /** Referência para rastrear se houve hard refresh */
  const wasHardRefresh = useRef(false)

  useEffect(() => {
    // =====================================================
    // DETECÇÃO VIA PERFORMANCE API
    // =====================================================
    
    // Usar Performance API para detectar tipo de navegação
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0]
      
      // Hard refresh é identificado pelo tipo 'reload'
      wasHardRefresh.current = navEntry.type === 'reload'
      
      if (wasHardRefresh.current) {
        console.log('🔄 Hard refresh detectado - preservando estado de autenticação')
      }
    }

    // =====================================================
    // DETECÇÃO VIA COMBINAÇÕES DE TECLAS
    // =====================================================
    
    /**
     * Detecta combinações de teclas que causam hard refresh
     * Como Ctrl+F5, Alt+F5, Ctrl+Shift+R, etc.
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      const isHardRefresh = 
        (event.altKey && event.key === 'F5') || 
        (event.ctrlKey && event.key === 'F5') ||
        (event.ctrlKey && event.shiftKey && event.key === 'R') ||
        (event.metaKey && event.shiftKey && event.key === 'R') // Mac

      if (isHardRefresh) {
        console.log('Hard refresh key combination detected')
        wasHardRefresh.current = true
        
        // Armazenar flag no sessionStorage para persistir durante o reload
        sessionStorage.setItem('hardRefreshFlag', 'true')
      }
    }

    // Verificar se há flag de hard refresh do reload anterior
    const hadHardRefresh = sessionStorage.getItem('hardRefreshFlag')
    if (hadHardRefresh) {
      console.log('Previous hard refresh detected from sessionStorage')
      wasHardRefresh.current = true
      // Limpar flag após usar
      sessionStorage.removeItem('hardRefreshFlag')
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return {
    wasHardRefresh: wasHardRefresh.current
  }
}