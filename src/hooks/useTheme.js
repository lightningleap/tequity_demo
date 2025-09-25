import { useState, useEffect } from 'react'

const THEME_KEY = 'theme'
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
}

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return THEMES.SYSTEM

    const savedTheme = localStorage.getItem(THEME_KEY)
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
      return savedTheme
    }

    return THEMES.SYSTEM
  })

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof window === 'undefined') return THEMES.LIGHT

    if (theme === THEMES.SYSTEM) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? THEMES.DARK
        : THEMES.LIGHT
    }

    return theme
  })

  useEffect(() => {
    const root = document.documentElement

    const applyTheme = (newTheme) => {
      if (newTheme === THEMES.DARK) {
        root.classList.add('dark')
        root.style.colorScheme = 'dark'
      } else {
        root.classList.remove('dark')
        root.style.colorScheme = 'light'
      }
    }

    const handleSystemThemeChange = (e) => {
      if (theme === THEMES.SYSTEM) {
        const newResolvedTheme = e.matches ? THEMES.DARK : THEMES.LIGHT
        setResolvedTheme(newResolvedTheme)
        applyTheme(newResolvedTheme)
      }
    }

    if (theme === THEMES.SYSTEM) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const newResolvedTheme = mediaQuery.matches ? THEMES.DARK : THEMES.LIGHT
      setResolvedTheme(newResolvedTheme)
      applyTheme(newResolvedTheme)

      mediaQuery.addEventListener('change', handleSystemThemeChange)

      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange)
      }
    } else {
      setResolvedTheme(theme)
      applyTheme(theme)
    }
  }, [theme])

  const setThemeValue = (newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setTheme(newTheme)
      localStorage.setItem(THEME_KEY, newTheme)
    }
  }

  const toggleTheme = () => {
    if (resolvedTheme === THEMES.DARK) {
      setThemeValue(THEMES.LIGHT)
    } else {
      setThemeValue(THEMES.DARK)
    }
  }

  const cycleTheme = () => {
    const themeOrder = [THEMES.LIGHT, THEMES.DARK, THEMES.SYSTEM]
    const currentIndex = themeOrder.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themeOrder.length
    setThemeValue(themeOrder[nextIndex])
  }

  return {
    theme,
    resolvedTheme,
    setTheme: setThemeValue,
    toggleTheme,
    cycleTheme,
    isDark: resolvedTheme === THEMES.DARK,
    isLight: resolvedTheme === THEMES.LIGHT,
    isSystem: theme === THEMES.SYSTEM,
    themes: THEMES
  }
}