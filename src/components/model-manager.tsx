'use client'

import { useState, useEffect } from 'react'
import { Loader2, Download, AlertCircle, Terminal, ChevronDown, ChevronRight, Check, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AI_MODELS, MODEL_FAMILIES, DEFAULT_MODEL, type AIModel } from '@/lib/config'
import { getOllamaModelStatus, installOllamaModel, deleteOllamaModel, type ModelInfo } from '@/lib/model-service'
import { useSettingsStore } from '@/store/settings-store'

export function ModelManager() {
  const [modelStates, setModelStates] = useState<Record<string, ModelInfo>>({})
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [installProgress, setInstallProgress] = useState<Record<string, number>>({})
  const [installError, setInstallError] = useState<string | null>(null)
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({
    [MODEL_FAMILIES.DEEPSEEK]: true // Default expanded
  })
  const { selectedModel, updateSettings } = useSettingsStore()

  const checkModelStatuses = async () => {
    const states: Record<string, ModelInfo> = {}
    for (const model of AI_MODELS) {
      if (model.provider === 'ollama') {
        states[model.id] = await getOllamaModelStatus(model.id)
      }
    }
    setModelStates(states)
  }

  useEffect(() => {
    checkModelStatuses()
    // Poll for status updates every 5 seconds
    const interval = setInterval(checkModelStatuses, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleInstall = async (modelId: string) => {
    setIsLoading((prev) => ({ ...prev, [modelId]: true }))
    setInstallProgress((prev) => ({ ...prev, [modelId]: 0 }))
    setInstallError(null)
    try {
      const result = await installOllamaModel(modelId, (progress) => {
        setInstallProgress((prev) => ({ ...prev, [modelId]: progress }))
      })
      if (result.status === 'error') {
        setInstallError(result.error || 'Failed to install model')
      } else {
        setModelStates((prev) => ({ ...prev, [modelId]: result }))
        await checkModelStatuses()
      }
    } catch (error) {
      setInstallError(error instanceof Error ? error.message : 'Failed to install model')
    } finally {
      setIsLoading((prev) => ({ ...prev, [modelId]: false }))
      setInstallProgress((prev) => {
        const { [modelId]: _, ...rest } = prev
        return rest
      })
    }
  }

  const handleDelete = async (modelId: string) => {
    if (!window.confirm('Are you sure you want to delete this model? You can reinstall it later if needed.')) {
      return
    }
    setIsLoading((prev) => ({ ...prev, [modelId]: true }))
    try {
      const result = await deleteOllamaModel(modelId)
      if (result.status === 'error') {
        setInstallError(result.error || 'Failed to delete model')
      } else {
        setModelStates((prev) => ({ ...prev, [modelId]: result }))
        // If the deleted model was selected, switch to default
        if (selectedModel === modelId) {
          updateSettings({ selectedModel: DEFAULT_MODEL })
        }
      }
      await checkModelStatuses()
    } catch (error) {
      setInstallError(error instanceof Error ? error.message : 'Failed to delete model')
    } finally {
      setIsLoading((prev) => ({ ...prev, [modelId]: false }))
    }
  }

  const toggleFamily = (family: string) => {
    setExpandedFamilies(prev => ({
      ...prev,
      [family]: !prev[family]
    }))
  }

  // Group models by family
  const modelsByFamily = AI_MODELS.reduce((acc, model) => {
    if (!acc[model.family]) {
      acc[model.family] = []
    }
    acc[model.family].push(model)
    return acc
  }, {} as Record<string, AIModel[]>)

  const renderModelCard = (model: AIModel) => {
    const state = modelStates[model.id]
    const loading = isLoading[model.id]
    const progress = installProgress[model.id]
    const isSelected = selectedModel === model.id
    const isReady = state?.status === 'running' || state?.status === 'installed'

    return (
      <div
        key={model.id}
        className={cn(
          'p-4 rounded-lg border transition-colors',
          isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{model.name}</h3>
              {model.isExperimental && (
                <span className="px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-500 rounded-full">
                  Experimental
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{model.description}</p>
            
            {/* Parameters & Status */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Size: {model.size}
              </span>
              <span className="text-muted-foreground">
                Status: {state ? getModelStatusText(state) : 'Checking...'}
              </span>
            </div>

            {/* Installation Progress */}
            {typeof progress === 'number' && (
              <div className="w-full bg-accent rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Capabilities */}
            {model.capabilities && (
              <div className="flex flex-wrap gap-2">
                {model.capabilities.map(capability => (
                  <span
                    key={capability}
                    className="px-2 py-1 text-xs bg-accent rounded-full"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {typeof progress === 'number' && (
                  <span className="text-sm">{progress}%</span>
                )}
              </div>
            ) : state?.status === 'not_installed' ? (
              <button
                onClick={() => handleInstall(model.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Install
              </button>
            ) : state?.status === 'error' ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : (
              <>
                <button
                  onClick={() => updateSettings({ selectedModel: model.id })}
                  disabled={!isReady}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md flex items-center gap-2',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground',
                    !isReady && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isSelected && <Check className="h-4 w-4" />}
                  {isSelected ? 'Selected' : 'Select'}
                </button>
                {isReady && !isSelected && (
                  <button
                    onClick={() => handleDelete(model.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Available Models</h3>
        <button
          onClick={() => checkModelStatuses()}
          className="p-1 hover:bg-accent rounded"
          title="Check status"
        >
          <Terminal className="h-4 w-4" />
        </button>
      </div>

      {installError && (
        <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md border border-destructive">
          {installError}
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(modelsByFamily).map(([family, models]) => (
          <div key={family} className="space-y-2">
            <button
              onClick={() => toggleFamily(family)}
              className="flex items-center gap-2 w-full text-left hover:bg-accent/50 p-2 rounded-md"
            >
              {expandedFamilies[family] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="font-medium">{family}</span>
              <span className="text-sm text-muted-foreground">
                ({models.length} {models.length === 1 ? 'model' : 'models'})
              </span>
            </button>

            {expandedFamilies[family] && (
              <div className="space-y-3 pl-6">
                {models.map(renderModelCard)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function getModelStatusText(state: ModelInfo) {
  if (!state) return 'Checking...'
  if (state.error) return state.error
  switch (state.status) {
    case 'not_installed':
      return 'Not installed'
    case 'installed':
    case 'running':
      return 'Ready'
    case 'error':
      return state.error || 'Error'
    default:
      return 'Unknown status'
  }
} 