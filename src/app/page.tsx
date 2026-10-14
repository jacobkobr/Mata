'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Composer } from '@/components/chat/composer'
import { MessageList } from '@/components/chat/message-list'
import { MessageRail } from '@/components/chat/message-rail'
import { ProviderSwitcher } from '@/components/chat/provider-switcher'
import { useMessageRail } from '@/hooks/use-message-rail'
import { useRailKeybinds } from '@/hooks/use-rail-keybinds'
import { BookmarkExportDialog } from '@/components/chat/bookmark-export-dialog'
import { PopoutWindow } from '@/components/popout-window'
import { ChatSidebar } from '@/components/chat-sidebar'
import { WelcomeHeader } from '@/components/welcome-header'
import { FileUpload } from '@/components/file-upload'
import { CompactChat } from '@/components/compact-chat'
import { QuickAsk } from '@/components/quick-ask'
import { useChatStore } from '@/store/chat-store'
import { useSettingsStore } from '@/store/settings-store'
import { useRailStore } from '@/store/rail-store'
import { useBookmarkStore } from '@/store/bookmark-store'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useWindowMode } from '@/hooks/use-window-mode'

export default function Home() {
  const [input, setInput] = useState('')
  const [showFileUpload, setShowFileUpload] = useState(false)
  const windowMode = useWindowMode()
  const isQuickAskMode = windowMode === 'quickask'
  const [isCompactMode, setIsCompactMode] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { messages, isLoading, sendMessage } = useChatStore()
  const { isPopoutMode, updateSettings } = useSettingsStore()
  const { setTheme, theme } = useTheme()
  const { containerRef, registerMessageRef, scrollToMessage, activeId } = useMessageRail(messages.map(m => m.id))
  const quickBookmarkColor = useRailStore((state) => state.quickBookmarkColor)
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark)

  useRailKeybinds({ messages, activeId, scrollToMessage })

  useEffect(() => {
    if (windowMode === 'compact') setIsCompactMode(true)
  }, [windowMode])

  useKeyboardShortcuts({
    toggleWindow: async () => {
      if (window.electron) {
        const isCompact = await window.electron.send('toggle-compact-mode')
        setIsCompactMode(isCompact)
      } else {
        updateSettings({ isPopoutMode: !isPopoutMode })
      }
    },
    focusInput: () => inputRef.current?.focus(),
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  })

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
    } else if (type === 'image') {
      // For images, we'll use the vision model
      await sendMessage('Please analyze this image:', {
        content,
        type: mimeType || 'image/jpeg'
      })
    }
  }

  if (isQuickAskMode) {
    return <QuickAsk />
  }

  if (isCompactMode) {
    return <CompactChat />
  }

  if (isPopoutMode) {
    return <PopoutWindow />
  }

  return (
    <div className="flex h-full">
      <BookmarkExportDialog />
      <ChatSidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background/50 backdrop-blur-sm">
        <div ref={containerRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeHeader />
          ) : (
            <div className="mx-auto flex max-w-3xl gap-2 p-4">
              <MessageList
                messages={messages}
                isLoading={isLoading}
                className="min-w-0 flex-1"
                onRegisterMessageRef={registerMessageRef}
              />
              <MessageRail
                messages={messages}
                activeId={activeId}
                onNavigate={scrollToMessage}
                onToggleBookmark={(id) => toggleBookmark(id, quickBookmarkColor)}
              />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4 sticky bottom-0">
          <div className="max-w-3xl mx-auto">
            <div className="mb-2 flex justify-start">
              <ProviderSwitcher />
            </div>

            {showFileUpload ? (
              <div className="mb-4">
                <FileUpload
                  onFileContent={handleFileContent}
                  className="max-w-xl mx-auto"
                />
              </div>
            ) : null}

            <Composer
              ref={inputRef}
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              showUpload
              onToggleUpload={() => setShowFileUpload(!showFileUpload)}
              showSendLabel
            />
          </div>
        </div>
      </div>
    </div>
  )
}
