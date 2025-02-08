'use client'

import { useState, useRef } from 'react'
import { useTheme } from 'next-themes'
import { ChatMessage } from '@/components/chat-message'
import { SettingsPanel } from '@/components/settings-panel'
import { PopoutWindow } from '@/components/popout-window'
import { ChatSidebar } from '@/components/chat-sidebar'
import { WelcomeHeader } from '@/components/welcome-header'
import { FileUpload } from '@/components/file-upload'
import { useChatStore } from '@/store/chat-store'
import { useSettingsStore } from '@/store/settings-store'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { Loader2, Send, Upload } from 'lucide-react'

export default function Home() {
  const [input, setInput] = useState('')
  const [showFileUpload, setShowFileUpload] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, isLoading, sendMessage } = useChatStore()
  const { isPopoutMode, updateSettings } = useSettingsStore()
  const { setTheme, theme } = useTheme()

  useKeyboardShortcuts({
    toggleWindow: () => updateSettings({ isPopoutMode: !isPopoutMode }),
    focusInput: () => inputRef.current?.focus(),
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    await sendMessage(input.trim())
    setInput('')
    
    // Scroll to bottom after sending message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleFileContent = async (content: string, type: 'text' | 'image', mimeType?: string) => {
    setShowFileUpload(false)
    if (type === 'text') {
      await sendMessage(`Please review this file content:\n\n\`\`\`\n${content}\n\`\`\``)
    } else if (type === 'image') {
      // For images, we'll use the vision model
      await sendMessage('Please analyze this image:', {
        content,
        type: mimeType || 'image/jpeg'
      })
    }
  }

  if (isPopoutMode) {
    return <PopoutWindow />
  }

  return (
    <div className="flex h-full">
      <ChatSidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background/50 backdrop-blur-sm">
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeHeader />
          ) : (
            <div className="max-w-3xl mx-auto p-4 space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4 sticky bottom-0">
          <div className="max-w-3xl mx-auto">
            {showFileUpload ? (
              <div className="mb-4">
                <FileUpload
                  onFileContent={handleFileContent}
                  className="max-w-xl mx-auto"
                />
              </div>
            ) : null}
            
            <form onSubmit={handleSubmit} className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="p-3 rounded-lg hover:bg-accent flex items-center justify-center h-[50px]"
                title="Upload file"
              >
                <Upload className="h-5 w-5" />
              </button>

              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full h-[50px] p-3 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  rows={1}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-4 h-[50px] bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span className="font-medium">Send</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 