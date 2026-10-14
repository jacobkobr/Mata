'use client'

import { useState, useRef, useEffect } from 'react'
import { Maximize2, Minimize2, X } from 'lucide-react'
import { useSettingsStore } from '@/store/settings-store'
import { useChatStore } from '@/store/chat-store'
import { Composer } from '@/components/chat/composer'
import { MessageList } from '@/components/chat/message-list'

export function PopoutWindow() {
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: 100 })
  const [size] = useState({ width: 360, height: 500 })
  const [isMinimized, setIsMinimized] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; startPos: typeof position }>()
  const { updateSettings } = useSettingsStore()
  const { messages, isLoading, sendMessage } = useChatStore()
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPos: position }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - size.width, dragRef.current.startPos.x + dx)),
      y: Math.max(0, Math.min(window.innerHeight - size.height, dragRef.current.startPos.y + dy)),
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    dragRef.current = undefined
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const content = input.trim()
    setInput('')
    await sendMessage(content)
    inputRef.current?.focus()
  }

  return (
    <div
      className="fixed rounded-lg border border-border bg-popover shadow-panel"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: isMinimized ? 48 : size.height,
        transition: 'height 0.2s ease-out',
      }}
    >
      {/* Title Bar */}
      <div
        className="h-12 bg-muted/60 flex items-center justify-between pl-4 pr-2 cursor-move select-none border-b border-border rounded-t-lg"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <span className="text-sm font-medium text-foreground">Mata AI</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => updateSettings({ isPopoutMode: false })}
            className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col h-[calc(100%-48px)]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <MessageList
              messages={messages}
              isLoading={isLoading}
              isCompact
              className="p-4"
              emptyState={
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Ask anything...
                </div>
              }
            />
          </div>

          {/* Input */}
          <div className="flex-none px-4 py-3 bg-muted/60 border-t border-border rounded-b-lg">
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
      )}
    </div>
  )
}
