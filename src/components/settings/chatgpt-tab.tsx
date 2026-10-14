'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import type { ChatGPTModel } from '@siwc/local'
import { useChatGPTSession } from '@/hooks/use-chatgpt-session'
import { useSettingsStore } from '@/store/settings-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToggleField } from '@/components/ui/toggle-field'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const CHATGPT_USAGE_URL = 'https://chatgpt.com/settings/usage'

export function ChatGPTTab() {
  const { session, isAvailable } = useChatGPTSession()
  const { activeProvider, chatGPTModelSlug, updateSettings } = useSettingsStore()
  const { resolvedTheme } = useTheme()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [models, setModels] = useState<ChatGPTModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  const isConnected = session.status === 'connected'
  const isReauthRequired = session.status === 'reauth_required'
  const isSharing = isConnected && session.sharing

  const loadModels = async () => {
    setIsLoadingModels(true)
    try {
      const list = await window.electron.chatgpt.listModels()
      setModels(list)
      if (!chatGPTModelSlug && list[0]) {
        updateSettings({ chatGPTModelSlug: list[0].slug })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not load ChatGPT models',
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setIsLoadingModels(false)
    }
  }

  useEffect(() => {
    if (!isSharing) return
    loadModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSharing])

  if (!isAvailable) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in with ChatGPT requires the Mata desktop app.
      </p>
    )
  }

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

  const handleSignOut = async () => {
    try {
      await window.electron.chatgpt.signOut()
      if (activeProvider === 'chatgpt') updateSettings({ activeProvider: 'ollama' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sign-out failed',
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">ChatGPT</h3>
          <p className="text-sm text-muted-foreground">
            Use your ChatGPT Plus or Pro plan for responses instead of a local model.
          </p>
        </div>

        {!isConnected ? (
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="shrink-0 disabled:opacity-60"
              aria-label="Continue with ChatGPT"
            >
              {isSigningIn ? (
                <div className="flex h-[30px] w-[161px] items-center justify-center rounded-xl border border-border">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolvedTheme === 'dark' ? '/chatgpt-brand/sign-in-with-chatgpt-white.svg' : '/chatgpt-brand/sign-in-with-chatgpt-black.svg'}
                  alt="Continue with ChatGPT"
                  height={30}
                />
              )}
            </button>
            {isReauthRequired && (
              <span className="text-xs text-warning">Your connection expired — sign in again to reconnect.</span>
            )}
          </div>
        ) : (
          <Button variant="outline" onClick={handleSignOut}>Disconnect</Button>
        )}
      </div>

      {isConnected && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">
                {session.identity?.email ?? session.profileLabel ?? 'Connected account'}
              </div>
              <div className="mt-1.5">
                {isSharing ? (
                  <Badge variant="success">Plan sharing enabled</Badge>
                ) : (
                  <Badge variant="warning">Plan sharing not enabled</Badge>
                )}
              </div>
            </div>
            <a
              href={CHATGPT_USAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1 text-sm text-primary hover:underline"
            >
              Manage usage
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {!isSharing && (
            <p className="text-sm text-muted-foreground">
              You&apos;re signed in, but this app isn&apos;t authorized to use your ChatGPT plan yet.
              Enable sharing for Mata in your ChatGPT account settings, then reconnect.
            </p>
          )}

          {isSharing && (
            <div className="space-y-3">
              <ToggleField
                label="Use ChatGPT for new messages"
                description="When enabled, Mata sends new messages to ChatGPT using your plan instead of a local Ollama model."
                checked={activeProvider === 'chatgpt'}
                onCheckedChange={(checked) => updateSettings({ activeProvider: checked ? 'chatgpt' : 'ollama' })}
              />

              {activeProvider === 'chatgpt' && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Model</label>
                    <button
                      onClick={loadModels}
                      disabled={isLoadingModels}
                      className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                      title="Refresh model list"
                    >
                      <RefreshCw className={cn('h-3.5 w-3.5', isLoadingModels && 'animate-spin')} />
                    </button>
                  </div>
                  {isLoadingModels ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading models...
                    </div>
                  ) : (
                    <select
                      value={chatGPTModelSlug ?? ''}
                      onChange={(e) => updateSettings({ chatGPTModelSlug: e.target.value })}
                      className="w-full p-2 rounded-md border border-input bg-background text-sm"
                    >
                      {models.map((model) => (
                        <option key={model.slug} value={model.slug}>{model.displayName}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
