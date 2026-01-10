import { useEffect } from 'react'

/**
 * Hook to enable scrolling on pages that need it (User and Admin modules)
 */
export function usePageScroll() {
  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return

    // Add classes
    document.documentElement.classList.add('admin-page')
    document.body.classList.add('admin-page')
    
    // Directly set styles to ensure scrolling works
    document.documentElement.style.overflow = 'auto'
    document.documentElement.style.height = 'auto'
    document.documentElement.style.minHeight = '100%'
    
    document.body.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.body.style.minHeight = '100%'
    
    root.style.overflow = 'auto'
    root.style.height = 'auto'
    root.style.minHeight = '100%'

    return () => {
      document.documentElement.classList.remove('admin-page')
      document.body.classList.remove('admin-page')
      
      // Reset styles
      document.documentElement.style.overflow = ''
      document.documentElement.style.height = ''
      document.documentElement.style.minHeight = ''
      
      document.body.style.overflow = ''
      document.body.style.height = ''
      document.body.style.minHeight = ''
      
      root.style.overflow = ''
      root.style.height = ''
      root.style.minHeight = ''
    }
  }, [])
}

