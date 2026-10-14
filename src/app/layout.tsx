import './globals.css'
import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
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

// webpack's dev-mode module loader wraps each module in eval() for fast
// rebuilds with accurate source maps; that's a next-dev-only behavior and
// never happens in the static-exported production build, so unsafe-eval
// only needs to be allowed here, not shipped.
const scriptSrc = process.env.NODE_ENV === 'development'
  ? "'self' 'unsafe-inline' 'unsafe-eval'"
  : "'self' 'unsafe-inline'"

// Renderer can't reach anything but itself and the local Ollama port.
// ChatGPT calls go through the main process over IPC, never a direct fetch
// from here, so there's no api.openai.com entry needed below.
const CSP = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' http://localhost:11434",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
      </head>
      <body className="font-sans min-h-screen bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
        >
          <TooltipProvider delayDuration={200}>
            <div className="flex flex-col h-screen">
              <AppShell>
                {children}
              </AppShell>
            </div>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 