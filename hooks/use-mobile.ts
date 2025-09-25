/**
 * =====================================================
 * HOOK DE DETECÇÃO MOBILE - BOOKEXCHANGE
 * Detecta se o dispositivo é mobile usando media queries
 * =====================================================
 */

import * as React from "react"

/** Breakpoint para considerar dispositivo mobile (768px) */
const MOBILE_BREAKPOINT = 768

/**
 * Hook para detectar se o usuário está em um dispositivo mobile
 * 
 * Funcionalidades:
 * - Detecta largura da tela em tempo real
 * - Usa media queries para responsividade
 * - Atualiza automaticamente ao redimensionar
 * - Retorna boolean indicando se é mobile
 * 
 * @returns true se for dispositivo mobile (< 768px), false caso contrário
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const isMobile = useIsMobile()
 *   
 *   return (
 *     <div className={isMobile ? "mobile-layout" : "desktop-layout"}>
 *       {isMobile ? "Versão Mobile" : "Versão Desktop"}
 *     </div>
 *   )
 * }
 * ```
 */
export function useIsMobile() {
  /** Estado interno para controlar se é mobile */
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Criar media query para detectar mobile
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Função para atualizar estado quando tela mudar
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Registrar listener para mudanças na tela
    mql.addEventListener("change", onChange)
    
    // Definir estado inicial
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    // Cleanup: remover listener ao desmontar
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Garantir retorno boolean (nunca undefined)
  return !!isMobile
}
