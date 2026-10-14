'use client'

import { useEffect, useRef, useState } from 'react'
import { Paperclip, Send, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useChatStore } from '@/store/chat-store'
import { cn } from '@/lib/utils'

/**
 * Always-on-top quick-ask overlay, summoned by a global shortcut. Independent
 * of the main window and compact mode — it's meant to be transient, like a
 * launcher, not a persistent alternate view. Each session starts its own new
 * chat (there's no shared "current chat" pointer across separate renderer
 * processes), which still lands in history once it's sent.
 */
export function QuickAsk() {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { messages, isLoading, sendMessage } = useChatStore()
  const lastReply = [...messages].reverse().find((m) => m.role === 'assistant' || m.role === 'error')

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-full w-full flex-col items-center gap-3 px-5 pt-16">
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center gap-2 rounded-full border border-white/10 bg-black/70 px-4 py-3 shadow-2xl backdrop-blur-xl"
      >
        <Paperclip className="h-4 w-4 shrink-0 text-white/50" />
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Mata..."
          rows={1}
          disabled={isLoading}
          className="h-6 flex-1 resize-none bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </button>
      </form>

      {lastReply && (
        <div
          className={cn(
            'w-full max-h-[260px] overflow-y-auto rounded-2xl border border-white/10 bg-black/70 px-5 py-4 text-sm shadow-2xl backdrop-blur-xl',
            lastReply.role === 'error' ? 'text-red-300' : 'text-white/90'
          )}
        >
          {lastReply.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{lastReply.content}</ReactMarkdown>
          ) : (
            <span className="text-white/40">Thinking…</span>
          )}
        </div>
      )}
    </div>
  )
}
