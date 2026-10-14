import { useState, useEffect } from 'react'
import { Loader2, Download, Trash2, ExternalLink } from 'lucide-react'
import { AI_MODELS, MODEL_FAMILIES } from '@/lib/config'
import { getOllamaModelStatus, installOllamaModel, installOllamaModelByName, deleteOllamaModel, type ModelInfo } from '@/lib/model-service'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { ModelCard } from '@/components/models/model-card'
import { ModelFamilyGroup } from '@/components/models/model-family-group'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

interface ExploreModelsProps {
  isOpen: boolean
  onClose: () => void
}

export function ExploreModels({ isOpen, onClose }: ExploreModelsProps) {
  const [modelStatuses, setModelStatuses] = useState<Record<string, ModelInfo>>({})
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [customPullName, setCustomPullName] = useState('')
  const [customPulls, setCustomPulls] = useState<Record<string, ModelInfo>>({})

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

  const handleCustomPull = async () => {
    const name = customPullName.trim()
    if (!name) return
    setCustomPullName('')
    setCustomPulls(prev => ({ ...prev, [name]: { name, status: 'not_installed', progress: 0 } }))

    const result = await installOllamaModelByName(name, (progress) => {
      setCustomPulls(prev => ({ ...prev, [name]: { ...prev[name], progress } }))
    })

    setCustomPulls(prev => ({ ...prev, [name]: result }))
    if (result.status === 'error') {
      toast({ variant: 'destructive', title: `Could not install "${name}"`, description: result.error })
    }
  }

  const toggleFamily = (family: string) => {
    setExpandedFamilies(prev => ({
      ...prev,
      [family]: !prev[family]
    }))
  }

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="flex h-[600px] w-[800px] max-w-[90vw] flex-col p-0">
        <ModalHeader>
          <ModalTitle className="text-lg">Explore Models</ModalTitle>
        </ModalHeader>

        <div className="border-b border-border p-4">
          <label className="text-sm font-medium">Install any Ollama model</label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Not limited to the catalog below — pull any tag from{' '}
            <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
              ollama.com/library <ExternalLink className="h-3 w-3" />
            </a>
            , e.g. <code className="rounded bg-muted px-1 py-0.5">qwen2.5-coder:32b</code>
          </p>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={customPullName}
              onChange={(e) => setCustomPullName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomPull()}
              placeholder="model:tag"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button onClick={handleCustomPull} disabled={!customPullName.trim()}>
              <Download className="h-4 w-4" />
              Pull
            </Button>
          </div>
          {Object.values(customPulls).length > 0 && (
            <div className="mt-3 space-y-2">
              {Object.values(customPulls).map((pull) => (
                <div key={pull.name} className="rounded-md border border-border p-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{pull.name}</span>
                    {pull.status === 'running' && <span className="text-xs text-success">Installed</span>}
                    {pull.status === 'error' && <span className="text-xs text-destructive">{pull.error}</span>}
                  </div>
                  {typeof pull.progress === 'number' && pull.status !== 'running' && (
                    <div className="mt-1.5">
                      <ProgressBar value={pull.progress} label={`Installing ${pull.name}`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(MODEL_FAMILIES).map((family) => {
                const familyModels = AI_MODELS.filter(m => m.family === family)
                if (familyModels.length === 0) return null

                return (
                  <ModelFamilyGroup
                    key={family}
                    family={family}
                    count={familyModels.length}
                    expanded={!!expandedFamilies[family]}
                    onToggle={() => toggleFamily(family)}
                  >
                    {familyModels.map((model) => {
                      const status = modelStatuses[model.id]
                      const isInstalled = status?.status === 'running'
                      const isInstalling = status?.progress !== undefined

                      return (
                        <ModelCard
                          key={model.id}
                          model={model}
                          status={status}
                          progress={status?.progress}
                          actions={
                            isInstalled ? (
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
                            )
                          }
                        />
                      )
                    })}
                  </ModelFamilyGroup>
                )
              })}
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  )
}
