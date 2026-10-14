import { useEffect, useState } from 'react'
import { MessageSquarePlus, Trash2, Edit2, Check, X, MessageSquare, Clock, PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/store/chat-store'
import { useSettingsStore } from '@/store/settings-store'
import { ChatSearch } from './chat-search'
import type { DBChat } from '@/lib/types'

export function ChatSidebar() {
  const {
    currentChatId,
    chatHistories,
    startNewChat,
    switchChat,
    deleteChat,
    updateChatTitle,
    loadChats
  } = useChatStore()
  const { sidebarCollapsed, updateSettings } = useSettingsStore()

  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  // Load chats on mount
  useEffect(() => {
    loadChats()
  }, [loadChats])

  const handleStartNewChat = () => {
    startNewChat()
  }

  const toggleCollapsed = () => updateSettings({ sidebarCollapsed: !sidebarCollapsed })

  const handleEditTitle = (chat: DBChat) => {
    setEditingChatId(chat.id)
    setEditTitle(chat.title)
  }

  const handleSaveTitle = (chatId: string) => {
    if (editTitle.trim()) {
      updateChatTitle(chatId, editTitle.trim())
    }
    setEditingChatId(null)
    setEditTitle('')
  }

  const handleCancelEdit = () => {
    setEditingChatId(null)
    setEditTitle('')
  }

  const handleDeleteChat = (chat: DBChat) => {
    if (window.confirm(`Delete "${chat.title}"? This can't be undone.`)) {
      deleteChat(chat.id)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return 'Today'
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return `${days} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (sidebarCollapsed) {
    return (
      <div className="relative h-full w-14 shrink-0 border-r border-border bg-card flex flex-col items-center gap-2 py-4">
        <button
          onClick={toggleCollapsed}
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          title="Expand sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <button
          onClick={handleStartNewChat}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90"
          title="New chat"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </button>
        <SidebarDivider onClick={toggleCollapsed} />
      </div>
    )
  }

  return (
    <div className="relative h-full w-80 shrink-0 border-r border-border bg-card flex flex-col">
      <div className="flex items-center gap-1 p-4 pb-2">
        <button
          onClick={handleStartNewChat}
          className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="text-sm font-medium">New Chat</span>
        </button>
        <button
          onClick={toggleCollapsed}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
          title="Collapse sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      </div>
      <div className="px-4 pb-2">
        <ChatSearch />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {Object.values(chatHistories)
            .sort((a, b) => b.lastUpdated - a.lastUpdated)
            .map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  'group rounded-lg transition-colors',
                  currentChatId === chat.id
                    ? 'bg-accent/50 hover:bg-accent/60'
                    : 'hover:bg-accent/30'
                )}
              >
                <div
                  className="flex flex-col p-3 cursor-pointer"
                  onClick={() => switchChat(chat.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {editingChatId === chat.id ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveTitle(chat.id)
                              } else if (e.key === 'Escape') {
                                handleCancelEdit()
                              }
                            }}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSaveTitle(chat.id)
                            }}
                            className="p-1 hover:bg-background rounded"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancelEdit()
                            }}
                            className="p-1 hover:bg-background rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium truncate">
                          {chat.title}
                        </span>
                      )}
                    </div>
                    {!editingChatId && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditTitle(chat)
                          }}
                          aria-label="Rename chat"
                          className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteChat(chat)
                          }}
                          aria-label="Delete chat"
                          className="p-1 hover:bg-background rounded text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(chat.lastUpdated)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      <SidebarDivider onClick={toggleCollapsed} />
    </div>
  )
}

/** Thin hover-highlighted edge, like ChatGPT/VS Code's sidebar divider — click to collapse/expand. */
function SidebarDivider({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Toggle sidebar"
      className="absolute inset-y-0 right-0 w-1 -mr-0.5 cursor-col-resize bg-transparent hover:bg-primary/40 transition-colors"
    />
  )
}
