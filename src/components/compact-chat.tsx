'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { useChatStore } from '@/store/chat-store'
import { Composer } from '@/components/chat/composer'
import { MessageList } from '@/components/chat/message-list'
import { cn } from '@/lib/utils'

export function CompactChat() {
  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { messages, isLoading, sendMessage } = useChatStore()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsExpanded(true)
    const content = input.trim()
    setInput('')
    await sendMessage(content)
  }

  const handleClose = async () => {
    await window.electron?.send('toggle-compact-mode')
  }

  return (
    <div className={cn(
      "flex flex-col transition-all duration-300 ease-in-out rounded-lg overflow-hidden bg-background/80 backdrop-blur-sm border border-border shadow-panel",
      isExpanded ? "h-[500px]" : "h-[50px]"
    )}>
      {/* Title Bar */}
      <div className="h-[50px] flex items-center justify-between px-4 bg-card/50 border-b border-border">
        <span className="text-sm font-medium">Mata AI</span>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-accent rounded-md"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4">
          <MessageList messages={messages} isLoading={isLoading} isCompact />
        </div>
      )}

      {/* Input */}
      <div className="p-2 bg-card/50 border-t border-border">
        <Composer
          ref={inputRef}
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          placeholder="Ask anything..."
          size="compact"
        />
      </div>
    </div>
  )
}
