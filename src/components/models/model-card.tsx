import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ProgressBar } from '@/components/ui/progress-bar'
import type { AIModel } from '@/lib/config'
import type { ModelInfo } from '@/lib/model-service'

export interface ModelCardProps {
  model: AIModel
  status?: ModelInfo
  progress?: number
  isSelected?: boolean
  /** Right-side action area — differs between the settings model manager and the explore-models modal. */
  actions: React.ReactNode
  className?: string
}

/**
 * Shared model card used by both the settings model manager and the
 * explore-models modal — previously two near-duplicated implementations.
 */
export function ModelCard({ model, status, progress, isSelected, actions, className }: ModelCardProps) {
  const hasError = status?.status === 'error'

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-4 transition-colors',
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{model.name}</h3>
            {model.isExperimental && <Badge variant="warning">Experimental</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{model.description}</p>

          <div className="flex flex-wrap gap-2">
            {model.capabilities.map((capability) => (
              <Badge key={capability}>{capability}</Badge>
            ))}
          </div>

          {(status?.size || status?.parameterSize || status?.quantization) && (
            <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              {status.size && <span>Size on disk: {status.size}</span>}
              {status.parameterSize && <span>Parameters: {status.parameterSize}</span>}
              {status.quantization && <span>Quantization: {status.quantization}</span>}
            </div>
          )}

          {typeof progress === 'number' && (
            <div className="space-y-1">
              <ProgressBar value={progress} label={`Installing ${model.name}`} />
              <div className="text-xs text-muted-foreground">Installing... {progress}%</div>
            </div>
          )}

          {hasError && status?.error && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span>{status.error}</span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2">{actions}</div>
      </div>
    </div>
  )
}
