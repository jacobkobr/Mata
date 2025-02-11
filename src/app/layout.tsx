import './globals.css'
import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AppShell } from '@/components/app-shell'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial'],
})

export const metadata: Metadata = {
  title: 'Mata AI',
  description: 'Your AI coding companion',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans min-h-screen bg-gradient-to-b from-background to-muted">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
        >
          <div className="flex flex-col h-screen">
            <AppShell>
              {children}
            </AppShell>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
} 