'use client'

import { useState, useEffect } from 'react'
import { Search, X, Clock } from 'lucide-react'
import { useChatStore } from '@/store/chat-store'
import { cn } from '@/lib/utils'

export function ChatSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { searchResults, searchChatHistory, switchChat } = useChatStore()

  useEffect(() => {
    if (query.trim()) {
      searchChatHistory(query)
    }
  }, [query, searchChatHistory])

  const handleResultClick = (chatId: string) => {
    switchChat(chatId)
    setIsOpen(false)
    setQuery('')
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  return (
    <div className="relative flex-1">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-background border border-input hover:bg-accent rounded-lg transition-colors"
          aria-label="Search chats"
        >
          <Search className="h-5 w-5" />
          <span className="font-medium">Search</span>
        </button>
      ) : (
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chat history..."
            className="w-full pl-11 pr-10 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            autoFocus
          />
          <button
            onClick={() => {
              setIsOpen(false)
              setQuery('')
            }}
            className="absolute right-4 p-1 hover:bg-accent rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Search Results */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-card rounded-lg border border-border shadow-lg">
          <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
            {searchResults.length > 0 ? (
              searchResults.map(({ message, score }) => (
                <button
                  key={message.id}
                  onClick={() => handleResultClick(message.chatId)}
                  className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      "w-2 h-2 mt-2 rounded-full flex-shrink-0",
                      message.role === 'user' ? 'bg-primary' : 'bg-secondary'
                    )} />
                    <div className="flex-1 space-y-1">
                      <div className="line-clamp-2 text-sm">{message.content}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(message.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 