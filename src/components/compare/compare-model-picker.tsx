import { useEffect, useState } from 'react'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import type { ChatGPTModel } from '@siwc/local'
import { AI_MODELS } from '@/lib/config'
import { useInstalledOllamaModels } from '@/hooks/use-installed-ollama-models'
import { useChatGPTSession } from '@/hooks/use-chatgpt-session'
import { cn } from '@/lib/utils'

export interface CompareModelPickerProps {
  providerId: 'ollama' | 'chatgpt'
  modelId: string
  label: string
  onSelect: (providerId: 'ollama' | 'chatgpt', modelId: string, label: string) => void
}

/** Slimmed-down sibling of ProviderSwitcher — picks one model for one side of a comparison, no Auto option. */
export function CompareModelPicker({ providerId, modelId, label, onSelect }: CompareModelPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [chatGPTModels, setChatGPTModels] = useState<ChatGPTModel[]>([])
  const { installedModels } = useInstalledOllamaModels()
  const { session, isAvailable } = useChatGPTSession()
  const isSharing = session.status === 'connected' && session.sharing

  useEffect(() => {
    if (!isSharing) return
    window.electron.chatgpt.listModels().then(setChatGPTModels).catch(() => {})
  }, [isSharing])

  const ollamaModels = AI_MODELS.filter((m) => installedModels.includes(m.id))

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-accent transition-colors"
      >
        <span className="max-w-[160px] truncate">{label}</span>
        <ChevronDown className="h-3 w-3 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 top-full mt-1 w-56 rounded-lg border border-border bg-card p-1 shadow-panel">
            <div className="px-2 pt-1 pb-1 text-xs font-medium text-muted-foreground">Local (Ollama)</div>
            {ollamaModels.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">No models installed</div>
            ) : (
              ollamaModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => { onSelect('ollama', model.id, model.name); setIsOpen(false) }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-accent',
                    providerId === 'ollama' && modelId === model.id && 'bg-accent'
                  )}
                >
                  {model.name}
                  {providerId === 'ollama' && modelId === model.id && <Check className="h-3.5 w-3.5" />}
                </button>
              ))
            )}

            <div className="mt-1 border-t border-border px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">ChatGPT</div>
            {!isAvailable ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Desktop app only</div>
            ) : !isSharing ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Not signed in / sharing off</div>
            ) : chatGPTModels.length === 0 ? (
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
              </div>
            ) : (
              chatGPTModels.map((model) => (
                <button
                  key={model.slug}
                  onClick={() => { onSelect('chatgpt', model.slug, model.displayName); setIsOpen(false) }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-accent',
                    providerId === 'chatgpt' && modelId === model.slug && 'bg-accent'
                  )}
                >
                  {model.displayName}
                  {providerId === 'chatgpt' && modelId === model.slug && <Check className="h-3.5 w-3.5" />}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
