'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useChatStore } from '@/store/chat-store'
import { Composer } from '@/components/chat/composer'
import { MessageList } from '@/components/chat/message-list'
import { ProviderSwitcher } from '@/components/chat/provider-switcher'
import { FileUpload } from '@/components/file-upload'
import { cn } from '@/lib/utils'

const EXPANDED_SIZE = { width: 760, height: 620 }

/**
 * Always-on-top quick-ask overlay, summoned by a global shortcut. Starts as
 * just an input bar; once a conversation starts, it asks the main process to
 * grow the actual OS window (once per session — after that the window keeps
 * whatever size/position the user leaves it at, including manual drags and
 * resizes). Independent of the main window and compact mode.
 */
export function QuickAsk() {
  const [input, setInput] = useState('')
  const [showFileUpload, setShowFileUpload] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { messages, isLoading, sendMessage, stopGeneration } = useChatStore()
  const hasExpandedRef = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (messages.length > 0 && !hasExpandedRef.current) {
      hasExpandedRef.current = true
      window.electron?.send('resize-quick-ask', EXPANDED_SIZE.width, EXPANDED_SIZE.height)
    }
  }, [messages.length])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        window.electron?.send('hide-quick-ask')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const content = input.trim()
    setInput('')
    await sendMessage(content)
  }

  const handleFileContent = async (content: string, type: 'text' | 'image', mimeType?: string) => {
    setShowFileUpload(false)
    if (type === 'text') {
      await sendMessage(`Please review this file content:\n\n\`\`\`\n${content}\n\`\`\``)
    } else {
      await sendMessage('Please analyze this image:', { content, type: mimeType || 'image/jpeg' })
    }
  }

  const hasConversation = messages.length > 0

  return (
    <div className="flex h-full w-full flex-col gap-2 rounded-2xl border border-border bg-background/90 p-3 shadow-panel backdrop-blur-xl">
      <div className={cn('flex shrink-0 items-center justify-between gap-2 app-region-drag', '[&_*]:app-region-no-drag')}>
        <ProviderSwitcher dropDirection="down" />
        <button
          onClick={() => window.electron?.send('hide-quick-ask')}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Close (Esc)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {hasConversation && (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-muted/40">
          <MessageList messages={messages} isLoading={isLoading} isCompact className="p-3" />
        </div>
      )}

      {showFileUpload && (
        <FileUpload onFileContent={handleFileContent} className="shrink-0" />
      )}

      <Composer
        ref={inputRef}
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onStop={stopGeneration}
        placeholder="Message Mata..."
        showUpload
        onToggleUpload={() => setShowFileUpload(!showFileUpload)}
        size="compact"
        className="shrink-0"
      />
    </div>
  )
}
