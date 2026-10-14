'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import type { ChatGPTModel } from '@siwc/local'
import { AI_MODELS } from '@/lib/config'
import { useSettingsStore } from '@/store/settings-store'
import { useChatGPTSession } from '@/hooks/use-chatgpt-session'
import { useInstalledOllamaModels } from '@/hooks/use-installed-ollama-models'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

/**
 * Lets the user pick which backend handles the *next* message — a local Ollama
 * model or a signed-in ChatGPT plan — without starting a new conversation. The
 * same message history is sent regardless of which one is picked.
 */
export interface ProviderSwitcherProps {
  className?: string
  /** Which way the dropdown opens — 'up' when anchored near the bottom of the screen (default), 'down' otherwise. */
  dropDirection?: 'up' | 'down'
}

export function ProviderSwitcher({ className, dropDirection = 'up' }: ProviderSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [chatGPTModels, setChatGPTModels] = useState<ChatGPTModel[]>([])
  const { activeProvider, selectedModel, chatGPTModelSlug, updateSettings } = useSettingsStore()
  const { installedModels } = useInstalledOllamaModels()
  const { session, isAvailable } = useChatGPTSession()

  const isConnected = session.status === 'connected'
  const isSharing = isConnected && session.sharing

  useEffect(() => {
    if (!isSharing) return
    window.electron.chatgpt.listModels()
      .then(setChatGPTModels)
      .catch((error) => {
        toast({
          variant: 'destructive',
          title: 'Could not load ChatGPT models',
          description: error instanceof Error ? error.message : undefined,
        })
      })
  }, [isSharing])

  const ollamaModels = AI_MODELS.filter((model) => installedModels.includes(model.id))
  const currentChatGPTModel = chatGPTModels.find((m) => m.slug === chatGPTModelSlug)

  const currentLabel =
    activeProvider === 'chatgpt'
      ? `ChatGPT · ${currentChatGPTModel?.displayName ?? chatGPTModelSlug ?? 'Select model'}`
      : `Local · ${AI_MODELS.find((m) => m.id === selectedModel)?.name ?? 'Select model'}`

  const handleSignIn = async () => {
    setIsSigningIn(true)
    try {
      await window.electron.chatgpt.signIn()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sign-in failed',
        description: error instanceof Error ? error.message : 'Could not sign in with ChatGPT.',
      })
    } finally {
      setIsSigningIn(false)
    }
  }

  const selectOllama = (modelId: string) => {
    updateSettings({ activeProvider: 'ollama', selectedModel: modelId })
    setIsOpen(false)
  }

  const selectChatGPT = (slug: string) => {
    updateSettings({ activeProvider: 'chatgpt', chatGPTModelSlug: slug })
    setIsOpen(false)
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-accent transition-colors"
      >
        <span className="max-w-[220px] truncate">{currentLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div
            className={cn(
              'absolute z-20 w-64 rounded-lg border border-border bg-card p-1 shadow-panel',
              dropDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
            )}
          >
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Local (Ollama)</div>
            {ollamaModels.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No models installed</div>
            ) : (
              ollamaModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => selectOllama(model.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent',
                    activeProvider === 'ollama' && selectedModel === model.id && 'bg-accent'
                  )}
                >
                  {model.name}
                  {activeProvider === 'ollama' && selectedModel === model.id && <Check className="h-4 w-4" />}
                </button>
              ))
            )}

            <div className="mt-1 border-t border-border px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
              ChatGPT
            </div>
            {!isAvailable ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Desktop app only</div>
            ) : !isConnected ? (
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent disabled:opacity-60"
              >
                {isSigningIn && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign in with ChatGPT
              </button>
            ) : !isSharing ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Signed in — enable plan sharing in Settings → ChatGPT
              </div>
            ) : chatGPTModels.length === 0 ? (
              <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading models...
              </div>
            ) : (
              chatGPTModels.map((model) => (
                <button
                  key={model.slug}
                  onClick={() => selectChatGPT(model.slug)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent',
                    activeProvider === 'chatgpt' && chatGPTModelSlug === model.slug && 'bg-accent'
                  )}
                >
                  {model.displayName}
                  {activeProvider === 'chatgpt' && chatGPTModelSlug === model.slug && <Check className="h-4 w-4" />}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
