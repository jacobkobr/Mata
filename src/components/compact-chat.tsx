'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, X } from 'lucide-react'
import { useChatStore } from '@/store/chat-store'
import { ChatMessage } from './chat-message'
import { cn } from '@/lib/utils'

export function CompactChat() {
  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, isLoading, sendMessage } = useChatStore()

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsExpanded(true)
    await sendMessage(input.trim())
    setInput('')
  }

  const handleClose = async () => {
    await window.electron?.send('toggle-compact-mode')
  }

  return (
    <div className={cn(
      "flex flex-col transition-all duration-300 ease-in-out rounded-lg overflow-hidden bg-background/95 backdrop-blur-md border border-border shadow-2xl",
      isExpanded ? "h-[500px]" : "h-[60px]"
    )}>
      {/* Title Bar */}
      <div className="h-[60px] flex items-center justify-between px-4 bg-card/80 border-b border-border shrink-0">
        <span className="text-sm font-semibold">Mata AI - Compact Mode</span>
        <button
          onClick={handleClose}
          className="p-1.5 hover:bg-accent rounded-md transition-colors"
          title="Close compact mode (Ctrl+Shift+M)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Start a conversation...
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} isCompact />
              ))}
              {isLoading && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      )}

      {/* Input */}
      <div className="p-2 bg-card/50 border-t border-border">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 p-2 h-[36px] max-h-[36px] bg-background rounded-md border border-input resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            rows={1}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
} 