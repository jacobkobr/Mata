'use client'

import { useState, useRef, useEffect } from 'react'
import { Maximize2, Minimize2, X } from 'lucide-react'
import { useSettingsStore } from '@/store/settings-store'
import { useChatStore } from '@/store/chat-store'
import { ChatMessage } from './chat-message'

export function PopoutWindow() {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 100 })
  const [size, setSize] = useState({ width: 400, height: 600 })
  const [isMinimized, setIsMinimized] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; startPos: typeof position }>()
  const { updateSettings } = useSettingsStore()
  const { messages, isLoading, sendMessage } = useChatStore()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPos: position,
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragRef.current) return

    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY

    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - size.width, dragRef.current.startPos.x + dx)),
      y: Math.max(0, Math.min(window.innerHeight - size.height, dragRef.current.startPos.y + dy)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleClose = () => {
    updateSettings({ isPopoutMode: false })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    await sendMessage(input.trim())
    setInput('')
  }

  return (
    <div
      className="fixed bg-card border border-border rounded-lg shadow-lg overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: isMinimized ? 40 : size.height,
        transition: 'height 0.2s ease-out',
      }}
    >
      {/* Title Bar */}
      <div
        className="h-10 bg-muted flex items-center justify-between px-3 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <span className="text-sm font-medium">Mata Chat</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-accent rounded"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-accent rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chat Content */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4" style={{ height: 'calc(100% - 110px)' }}>
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-pulse text-muted-foreground">...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
} 