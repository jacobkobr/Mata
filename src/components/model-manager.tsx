'use client'

import { useState, useEffect } from 'react'
import { Loader2, Download, AlertCircle, Terminal, Check, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AI_MODELS, DEFAULT_MODEL, type AIModel } from '@/lib/config'
import { getOllamaModelStatus, installOllamaModel, deleteOllamaModel, type ModelInfo } from '@/lib/model-service'
import { useSettingsStore } from '@/store/settings-store'
import { toast } from '@/components/ui/use-toast'
import { ModelCard } from '@/components/models/model-card'
import { ModelFamilyGroup } from '@/components/models/model-family-group'

export function ModelManager() {
  const [modelStates, setModelStates] = useState<Record<string, ModelInfo>>({})
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [installProgress, setInstallProgress] = useState<Record<string, number>>({})
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({})
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
    try {
      const result = await installOllamaModel(modelId, (progress) => {
        setInstallProgress((prev) => ({ ...prev, [modelId]: progress }))
      })
      if (result.status === 'error') {
        toast({ variant: 'destructive', title: 'Install failed', description: result.error || 'Failed to install model' })
      } else {
        setModelStates((prev) => ({ ...prev, [modelId]: result }))
        await checkModelStatuses()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Install failed',
        description: error instanceof Error ? error.message : 'Failed to install model',
      })
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
        toast({ variant: 'destructive', title: 'Delete failed', description: result.error || 'Failed to delete model' })
      } else {
        setModelStates((prev) => ({ ...prev, [modelId]: result }))
        // If the deleted model was selected, switch to default
        if (selectedModel === modelId) {
          updateSettings({ selectedModel: DEFAULT_MODEL })
        }
      }
      await checkModelStatuses()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete model',
      })
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

  const renderModelActions = (model: AIModel) => {
    const state = modelStates[model.id]
    const loading = isLoading[model.id]
    const progress = installProgress[model.id]
    const isSelected = selectedModel === model.id
    const isReady = state?.status === 'running' || state?.status === 'installed'

    if (loading) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {typeof progress === 'number' && <span className="text-sm">{progress}%</span>}
        </div>
      )
    }

    if (state?.status === 'not_installed') {
      return (
        <button
          onClick={() => handleInstall(model.id)}
          className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Install
        </button>
      )
    }

    if (state?.status === 'error') {
      return <AlertCircle className="h-5 w-5 text-destructive" />
    }

    return (
      <>
        <button
          onClick={() => updateSettings({ selectedModel: model.id })}
          disabled={!isReady}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm',
            isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
            !isReady && 'cursor-not-allowed opacity-50'
          )}
        >
          {isSelected && <Check className="h-4 w-4" />}
          {isSelected ? 'Selected' : 'Select'}
        </button>
        {isReady && !isSelected && (
          <button
            onClick={() => handleDelete(model.id)}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}
      </>
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

      <div className="space-y-4">
        {Object.entries(modelsByFamily).map(([family, models]) => (
          <ModelFamilyGroup
            key={family}
            family={family}
            count={models.length}
            expanded={!!expandedFamilies[family]}
            onToggle={() => toggleFamily(family)}
          >
            {models.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                status={modelStates[model.id]}
                progress={installProgress[model.id]}
                isSelected={selectedModel === model.id}
                actions={renderModelActions(model)}
              />
            ))}
          </ModelFamilyGroup>
        ))}
      </div>
    </div>
  )
}
