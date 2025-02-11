'use client'

import { useState, useRef, useEffect } from 'react'
import { Maximize2, Minimize2, X, Send, Loader2 } from 'lucide-react'
import { useSettingsStore } from '@/store/settings-store'
import { useChatStore } from '@/store/chat-store'
import { ChatMessage } from './chat-message'
import { cn } from '@/lib/utils'

export function PopoutWindow() {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: 100 })
  const [size, setSize] = useState({ width: 360, height: 500 })
  const [isMinimized, setIsMinimized] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; startPos: typeof position }>()
  const { updateSettings } = useSettingsStore()
  const { messages, isLoading, sendMessage } = useChatStore()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    await sendMessage(input.trim())
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <div
      className="fixed bg-[#0D1117] border border-[#30363D] rounded-lg shadow-2xl"
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
        className="h-12 bg-[#161B22] flex items-center justify-between pl-4 pr-2 cursor-move select-none border-b border-[#30363D]"
        onMouseDown={handleMouseDown}
      >
        <span className="text-sm font-medium text-[#E6EDF3]">Mata AI</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-[#30363D] rounded-md text-[#7D8590] hover:text-[#E6EDF3] transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => updateSettings({ isPopoutMode: false })}
            className="p-1.5 hover:bg-[#30363D] rounded-md text-[#7D8590] hover:text-[#E6EDF3] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col h-[calc(100%-48px)]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#7D8590] text-sm">
                Ask anything...
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} isCompact />
                ))}
                {isLoading && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#7D8590]" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex-none px-4 py-3 bg-[#161B22] border-t border-[#30363D]">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 h-9 px-3 rounded-md border border-[#30363D] bg-[#0D1117] text-[#E6EDF3] text-sm placeholder-[#7D8590] focus:outline-none focus:border-[#388BFD] focus:ring-1 focus:ring-[#388BFD]"
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
                className={cn(
                  "h-9 px-3 rounded-md transition-colors text-sm font-medium",
                  input.trim()
                    ? "bg-[#1F6FEB] text-white hover:bg-[#388BFD]"
                    : "bg-[#21262D] text-[#7D8590]"
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 