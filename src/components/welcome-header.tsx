import { AI_MODELS } from '@/lib/config'
import { useSettingsStore } from '@/store/settings-store'
import { ChevronDown, Loader2, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { getOllamaModelStatus, type ModelInfo } from '@/lib/model-service'
import { ExploreModels } from './explore-models'

export function WelcomeHeader() {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  const [isExploreOpen, setIsExploreOpen] = useState(false)
  const [installedModels, setInstalledModels] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { selectedModel, updateSettings } = useSettingsStore()

  useEffect(() => {
    async function checkInstalledModels() {
      setIsLoading(true)
      const installed: string[] = []
      
      for (const model of AI_MODELS) {
        const status = await getOllamaModelStatus(model.id)
        if (status.status === 'running' || status.status === 'installed') {
          installed.push(model.id)
        }
      }
      
      setInstalledModels(installed)
      setIsLoading(false)
    }

    checkInstalledModels()
  }, [])

  const currentModel = AI_MODELS.find(m => m.id === selectedModel)
  const availableModels = AI_MODELS.filter(model => installedModels.includes(model.id))

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

        {/* Model Selection */}
        <div className="flex items-center justify-center gap-2">
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
              disabled={isLoading || availableModels.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading models...</span>
                </>
              ) : availableModels.length === 0 ? (
                <span className="text-sm text-muted-foreground">No models installed</span>
              ) : (
                <>
                  <span className="text-sm font-medium">
                    {currentModel?.name || 'Select Model'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Dropdown Menu */}
            {isModelDropdownOpen && availableModels.length > 0 && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsModelDropdownOpen(false)}
                />
                <div className="absolute z-20 mt-2 w-48 rounded-lg bg-card border border-border shadow-lg">
                  <div className="py-1">
                    {availableModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          updateSettings({ selectedModel: model.id })
                          setIsModelDropdownOpen(false)
                        }}
                        className={cn(
                          'w-full px-4 py-2 text-sm text-left hover:bg-accent transition-colors',
                          model.id === selectedModel && 'bg-accent'
                        )}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

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