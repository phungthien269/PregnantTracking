'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  ACCENTS,
  type Accent,
  THEME_MODES,
  type ThemeMode,
  ACCENT_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from '@mevabe/ui'

interface ThemeContextValue {
  mode: ThemeMode
  accent: Accent
  setMode: (mode: ThemeMode) => void
  setAccent: (accent: Accent) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function resolveDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(mode: ThemeMode, accent: Accent) {
  const root = document.documentElement
  root.classList.toggle('dark', resolveDark(mode))
  root.dataset.accent = accent
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [accent, setAccentState] = useState<Accent>('rose')

  useEffect(() => {
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY)
    const savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY)
    const initialMode = THEME_MODES.includes(savedMode as ThemeMode) ? (savedMode as ThemeMode) : 'system'
    const initialAccent = ACCENTS.includes(savedAccent as Accent) ? (savedAccent as Accent) : 'rose'
    setModeState(initialMode)
    setAccentState(initialAccent)
    applyTheme(initialMode, initialAccent)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      accent,
      setMode: (m) => {
        setModeState(m)
        localStorage.setItem(THEME_STORAGE_KEY, m)
        applyTheme(m, accent)
      },
      setAccent: (a) => {
        setAccentState(a)
        localStorage.setItem(ACCENT_STORAGE_KEY, a)
        applyTheme(mode, a)
      },
    }),
    [mode, accent],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme phải dùng trong <ThemeProvider>')
  return ctx
}
