'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Composer } from '@/components/chat/composer'
import { MessageList } from '@/components/chat/message-list'
import { MessageRail } from '@/components/chat/message-rail'
import { ProviderSwitcher } from '@/components/chat/provider-switcher'
import { SlashCommandMenu } from '@/components/chat/slash-command-menu'
import { TemplateVariableForm } from '@/components/chat/template-variable-form'
import { AttachmentPicker } from '@/components/chat/attachment-picker'
import { useMessageRail } from '@/hooks/use-message-rail'
import { useRailKeybinds } from '@/hooks/use-rail-keybinds'
import { BookmarkExportDialog } from '@/components/chat/bookmark-export-dialog'
import { ChatSidebar } from '@/components/chat-sidebar'
import { WelcomeHeader } from '@/components/welcome-header'
import { FileUpload } from '@/components/file-upload'
import { CompactChat } from '@/components/compact-chat'
import { QuickAsk } from '@/components/quick-ask'
import { useChatStore } from '@/store/chat-store'
import { useRailStore } from '@/store/rail-store'
import { useBookmarkStore } from '@/store/bookmark-store'
import { usePromptTemplateStore } from '@/store/prompt-template-store'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useWindowMode } from '@/hooks/use-window-mode'
import {
  matchingTemplates,
  parseSlashCommand,
  expandTemplate,
  getUserVariables,
  type PromptTemplate,
} from '@/lib/prompt-templates'

export default function Home() {
  const [input, setInput] = useState('')
  const [showFileUpload, setShowFileUpload] = useState(false)
  const windowMode = useWindowMode()
  const isQuickAskMode = windowMode === 'quickask'
  const [isCompactMode, setIsCompactMode] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { messages, isLoading, sendMessage, stopGeneration, queueMessage, queuedMessages, removeQueuedMessage } = useChatStore()
  const { setTheme, theme } = useTheme()
  const { containerRef, registerMessageRef, scrollToMessage, activeId } = useMessageRail(messages.map(m => m.id))
  const quickBookmarkColor = useRailStore((state) => state.quickBookmarkColor)
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark)
  const templates = usePromptTemplateStore((state) => state.templates)

  // Slash-command autocomplete: tracked only while the composer holds just
  // "/" + a partial trigger name (no space yet) — once a space is typed the
  // menu closes and resolution happens at send time instead (see handleSubmit).
  const [activeSlashIndex, setActiveSlashIndex] = useState(0)
  const [variableFormTemplate, setVariableFormTemplate] = useState<PromptTemplate | null>(null)
  const [variableFormVars, setVariableFormVars] = useState<string[]>([])

  const slashQuery = useMemo(() => {
    const match = input.match(/^\/([A-Za-z0-9_-]*)$/)
    return match ? match[1] : null
  }, [input])
  const matchedTemplates = useMemo(
    () => (slashQuery !== null ? matchingTemplates(templates, slashQuery) : []),
    [slashQuery, templates]
  )

  useEffect(() => {
    setActiveSlashIndex(0)
  }, [slashQuery])

  const applyTemplateSelection = (template: PromptTemplate) => {
    const vars = getUserVariables(template.body)
    if (vars.length === 0) {
      setInput(expandTemplate(template.body, {}))
    } else if (vars.length === 1) {
      // Lets the user keep typing right after the trigger as the variable's
      // value — resolved against the rest of the text at send time.
      setInput(`/${template.trigger} `)
    } else {
      setInput('')
      setVariableFormTemplate(template)
      setVariableFormVars(vars)
    }
  }

  // Capture phase so this runs before the composer's own Enter-submits-the-form
  // handler — otherwise selecting a template from the menu would also submit
  // whatever was in the box.
  useEffect(() => {
    const el = inputRef.current
    if (!el || matchedTemplates.length === 0) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        setActiveSlashIndex((i) => (i + 1) % matchedTemplates.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        setActiveSlashIndex((i) => (i - 1 + matchedTemplates.length) % matchedTemplates.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        e.stopPropagation()
        applyTemplateSelection(matchedTemplates[activeSlashIndex] ?? matchedTemplates[0])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setInput('')
      }
    }
    el.addEventListener('keydown', handleKeyDown, true)
    return () => el.removeEventListener('keydown', handleKeyDown, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedTemplates, activeSlashIndex])

  useRailKeybinds({ messages, activeId, scrollToMessage })

  useEffect(() => {
    if (windowMode === 'compact') setIsCompactMode(true)
  }, [windowMode])

  useKeyboardShortcuts({
    toggleWindow: async () => {
      if (window.electron) {
        const isCompact = await window.electron.send('toggle-compact-mode')
        setIsCompactMode(isCompact)
      }
    },
    focusInput: () => inputRef.current?.focus(),
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    const trimmed = input.trim()

    const parsed = parseSlashCommand(trimmed, templates)
    if (parsed) {
      if (parsed.userVariables.length === 0) {
        setInput('')
        queueMessage(expandTemplate(parsed.template.body, {}))
        return
      }
      if (parsed.userVariables.length === 1) {
        setInput('')
        queueMessage(expandTemplate(parsed.template.body, { [parsed.userVariables[0]]: parsed.rest }))
        return
      }
      // More than one blank to fill in and the menu wasn't used to collect
      // them — ask for them explicitly instead of sending "/trigger ..." as
      // literal text.
      setInput('')
      setVariableFormTemplate(parsed.template)
      setVariableFormVars(parsed.userVariables)
      return
    }

    setInput('')
    // Queues behind the in-flight reply instead of being blocked when isLoading.
    queueMessage(trimmed)
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

  const handleAttachment = (content: string, name: string, isDirectory: boolean) => {
    queueMessage(
      `Please review the following ${isDirectory ? 'files' : 'file'} (${name}):\n\n\`\`\`\n${content}\n\`\`\``
    )
  }

  if (isQuickAskMode) {
    return <QuickAsk />
  }

  if (isCompactMode) {
    return <CompactChat />
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
            <div className="mb-2 flex items-center justify-between">
              <ProviderSwitcher />
              <AttachmentPicker
                onAttach={handleAttachment}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              />
            </div>

            {showFileUpload ? (
              <div className="mb-4">
                <FileUpload
                  onFileContent={handleFileContent}
                  className="max-w-xl mx-auto"
                />
              </div>
            ) : null}

            {matchedTemplates.length > 0 && (
              <SlashCommandMenu
                templates={matchedTemplates}
                activeIndex={activeSlashIndex}
                onSelect={applyTemplateSelection}
                onHover={setActiveSlashIndex}
              />
            )}

            {queuedMessages.length > 0 && (
              <div className="mb-2 flex flex-col gap-1">
                {queuedMessages.map((msg, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground"
                  >
                    <span className="shrink-0 font-medium text-foreground/70">Queued</span>
                    <span className="flex-1 truncate">{msg}</span>
                    <button
                      onClick={() => removeQueuedMessage(index)}
                      className="shrink-0 rounded p-0.5 hover:bg-accent hover:text-foreground"
                      aria-label="Remove from queue"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Composer
              ref={inputRef}
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              onStop={stopGeneration}
              showUpload
              onToggleUpload={() => setShowFileUpload(!showFileUpload)}
              showSendLabel
            />
          </div>
        </div>
      </div>

      <TemplateVariableForm
        template={variableFormTemplate}
        variables={variableFormVars}
        onClose={() => setVariableFormTemplate(null)}
        onExpand={(expanded) => {
          setInput(expanded)
          setVariableFormTemplate(null)
          inputRef.current?.focus()
        }}
      />
    </div>
  )
}
