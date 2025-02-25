'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: 'class' | 'data-theme'
  defaultTheme?: string
}

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
}: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute={attribute} defaultTheme={defaultTheme}>
      {children}
    </NextThemesProvider>
  )
} 