import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertCircle, Loader2, Check, Download, Trash2, ChevronRight, ExternalLink } from 'lucide-react'
import { AI_MODELS, MODEL_FAMILIES } from '@/lib/config'
import { cn } from '@/lib/utils'
import { getOllamaModelStatus, installOllamaModel, deleteOllamaModel, type ModelInfo } from '@/lib/model-service'

interface ExploreModelsProps {
  isOpen: boolean
  onClose: () => void
}

export function ExploreModels({ isOpen, onClose }: ExploreModelsProps) {
  const [modelStatuses, setModelStatuses] = useState<Record<string, ModelInfo>>({})
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      checkModelStatuses()
    }
  }, [isOpen])

  const checkModelStatuses = async () => {
    setIsLoading(true)
    const statuses: Record<string, ModelInfo> = {}
    
    for (const model of AI_MODELS) {
      const status = await getOllamaModelStatus(model.id)
      statuses[model.id] = status
    }
    
    setModelStatuses(statuses)
    setIsLoading(false)
  }

  const handleInstall = async (modelId: string) => {
    setModelStatuses(prev => ({
      ...prev,
      [modelId]: { ...prev[modelId], status: 'not_installed', progress: 0 }
    }))

    await installOllamaModel(
      modelId,
      (progress) => {
        setModelStatuses(prev => ({
          ...prev,
          [modelId]: { ...prev[modelId], progress }
        }))
      }
    )

    await checkModelStatuses()
  }

  const handleDelete = async (modelId: string) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      await deleteOllamaModel(modelId)
      await checkModelStatuses()
    }
  }

  const toggleFamily = (family: string) => {
    setExpandedFamilies(prev => ({
      ...prev,
      [family]: !prev[family]
    }))
  }

  if (!isOpen) return null

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-[800px] h-[600px] bg-card shadow-lg rounded-lg border border-border flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Explore Models</h2>
            <a
              href="https://ollama.com/library"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Browse All Models</span>
            </a>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-accent"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Looking for more models?</strong> Visit the{' '}
                  <a
                    href="https://ollama.com/library"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Ollama Library
                  </a>
                  {' '}to browse hundreds of models. Install any model using:{' '}
                  <code className="px-2 py-1 bg-muted rounded text-xs">ollama pull model-name</code>
                </p>
              </div>

              {Object.values(MODEL_FAMILIES).map((family) => {
                const familyModels = AI_MODELS.filter(m => m.family === family)
                if (familyModels.length === 0) return null

                return (
                  <div key={family} className="space-y-2">
                    <button
                      onClick={() => toggleFamily(family)}
                      className="flex items-center gap-2 text-lg font-medium"
                    >
                      <ChevronRight
                        className={cn(
                          "h-5 w-5 transition-transform",
                          expandedFamilies[family] && "rotate-90"
                        )}
                      />
                      {family}
                    </button>

                    {expandedFamilies[family] && (
                      <div className="grid grid-cols-1 gap-4 pl-6">
                        {familyModels.map((model) => {
                          const status = modelStatuses[model.id]
                          const isInstalled = status?.status === 'running'
                          const isInstalling = status?.progress !== undefined
                          const hasError = status?.status === 'error'

                          return (
                            <div
                              key={model.id}
                              className="flex flex-col gap-2 p-4 rounded-lg border border-border bg-card/50"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-medium">{model.name}</h3>
                                  <p className="text-sm text-muted-foreground">{model.description}</p>
                                </div>
                                {isInstalled ? (
                                  <button
                                    onClick={() => handleDelete(model.id)}
                                    className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                                    title="Delete model"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleInstall(model.id)}
                                    disabled={isInstalling}
                                    className="p-2 text-primary hover:bg-primary/10 rounded-md disabled:opacity-50"
                                    title="Install model"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {model.capabilities.map((capability) => (
                                  <span
                                    key={capability}
                                    className="px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground"
                                  >
                                    {capability}
                                  </span>
                                ))}
                              </div>

                              {status?.size && (
                                <div className="text-xs text-muted-foreground">
                                  Size on disk: {status.size}
                                </div>
                              )}

                              {isInstalling && (
                                <div className="mt-2">
                                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary transition-all duration-300"
                                      style={{ width: `${status.progress}%` }}
                                    />
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Installing... {status.progress}%
                                  </div>
                                </div>
                              )}

                              {hasError && (
                                <div className="flex items-center gap-2 text-xs text-destructive mt-2">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>{status.error}</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
} 