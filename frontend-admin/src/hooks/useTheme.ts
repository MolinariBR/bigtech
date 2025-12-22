// Hook para gerenciar tema dark/light/auto
import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light')

  useEffect(() => {
    // Verificar tema salvo no localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null
    if (savedTheme) {
      setTheme(savedTheme)
      if (savedTheme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        document.documentElement.classList.toggle('dark', prefersDark)
      } else {
        document.documentElement.classList.toggle('dark', savedTheme === 'dark')
      }
    } else {
      // Detectar preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme('auto')
      document.documentElement.classList.toggle('dark', prefersDark)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    localStorage.setItem('theme', newTheme)
  }

  const setThemePreference = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme)
    if (newTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    } else {
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }
    localStorage.setItem('theme', newTheme)
  }

  return { theme, toggleTheme, setThemePreference }
}