import { useEffect, useState } from 'react'
import { MessageSquarePlus, Trash2, Edit2, Check, X, MessageSquare, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/store/chat-store'
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

  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  // Load chats on mount
  useEffect(() => {
    loadChats()
  }, [loadChats])

  const handleStartNewChat = () => {
    startNewChat()
  }

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

  return (
    <div className="w-80 h-full bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border space-y-2">
        <button
          onClick={handleStartNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <MessageSquarePlus className="h-5 w-5" />
          <span className="font-medium">New Chat</span>
        </button>
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
                          className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteChat(chat.id)
                          }}
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
    </div>
  )
} 