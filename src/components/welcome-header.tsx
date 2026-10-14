import { useState } from 'react'
import { ProviderSwitcher } from '@/components/chat/provider-switcher'
import { ExploreModels } from './explore-models'

export function WelcomeHeader() {
  const [isExploreOpen, setIsExploreOpen] = useState(false)

  return (
    <div className="relative">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-500/20 to-cyan-400/20 dark:from-purple-900/30 dark:via-blue-800/30 dark:to-cyan-700/30 blur-3xl" />

      {/* Content */}
      <div className="relative px-6 py-12 text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-cyan-500 dark:from-purple-400 dark:to-cyan-300 bg-clip-text text-transparent">
          Welcome to Mata
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your local AI assistant powered by state-of-the-art models
        </p>

        <div className="flex items-center justify-center gap-2">
          <ProviderSwitcher dropDirection="down" />

          <button
            onClick={() => setIsExploreOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
          >
            <span className="text-sm font-medium">Explore more...</span>
          </button>
        </div>
      </div>

      <ExploreModels
        isOpen={isExploreOpen}
        onClose={() => setIsExploreOpen(false)}
      />
    </div>
  )
}
