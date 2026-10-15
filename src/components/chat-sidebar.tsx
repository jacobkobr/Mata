import { useEffect, useMemo, useState } from 'react'
import {
  MessageSquarePlus,
  Trash2,
  Edit2,
  Check,
  X,
  MessageSquare,
  Clock,
  PanelLeft,
  Pin,
  PinOff,
  MoreHorizontal,
  Folder,
  FolderPlus,
  ChevronRight,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatStore, type Folder as ChatFolder } from '@/store/chat-store'
import { useSettingsStore } from '@/store/settings-store'
import { ChatSearch } from './chat-search'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SidebarChat {
  id: string
  title: string
  lastUpdated: number
  pinned: boolean
  tags: string[]
  folderId: string | null
}

export function ChatSidebar() {
  const {
    currentChatId,
    chatHistories,
    folders,
    startNewChat,
    switchChat,
    deleteChat,
    updateChatTitle,
    loadChats,
    togglePinChat,
    addTagToChat,
    removeTagFromChat,
    moveChatToFolder,
    createFolder,
    renameFolder,
    deleteFolder,
  } = useChatStore()
  const { sidebarCollapsed, updateSettings } = useSettingsStore()

  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [taggingChatId, setTaggingChatId] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({})
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState('')

  // Load chats on mount
  useEffect(() => {
    loadChats()
  }, [loadChats])

  const chats: SidebarChat[] = useMemo(
    () => Object.values(chatHistories).map(c => ({
      id: c.id,
      title: c.title,
      lastUpdated: c.lastUpdated,
      pinned: c.pinned,
      tags: c.tags,
      folderId: c.folderId,
    })),
    [chatHistories]
  )

  const byRecency = (a: SidebarChat, b: SidebarChat) => b.lastUpdated - a.lastUpdated
  const pinnedChats = chats.filter(c => c.pinned).sort(byRecency)
  const folderList = Object.values(folders).sort((a, b) => a.name.localeCompare(b.name))
  const ungroupedChats = chats.filter(c => !c.pinned && !c.folderId).sort(byRecency)

  const handleStartNewChat = () => startNewChat()
  const toggleCollapsed = () => updateSettings({ sidebarCollapsed: !sidebarCollapsed })

  const handleEditTitle = (chat: SidebarChat) => {
    setEditingChatId(chat.id)
    setEditTitle(chat.title)
  }

  const handleSaveTitle = (chatId: string) => {
    if (editTitle.trim()) updateChatTitle(chatId, editTitle.trim())
    setEditingChatId(null)
    setEditTitle('')
  }

  const handleCancelEdit = () => {
    setEditingChatId(null)
    setEditTitle('')
  }

  const handleDeleteChat = (chat: SidebarChat) => {
    if (window.confirm(`Delete "${chat.title}"? This can't be undone.`)) {
      deleteChat(chat.id)
    }
  }

  const handleAddTag = (chatId: string) => {
    if (tagInput.trim()) addTagToChat(chatId, tagInput.trim())
    setTagInput('')
    setTaggingChatId(null)
  }

  const handleCreateFolder = () => createFolder('New Folder')

  const handleDeleteFolder = (folder: ChatFolder) => {
    if (window.confirm(`Delete folder "${folder.name}"? Chats inside stay, just ungrouped.`)) {
      deleteFolder(folder.id)
    }
  }

  const toggleFolderCollapsed = (folderId: string) =>
    setCollapsedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }))

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  const renderChatRow = (chat: SidebarChat) => (
    <div
      key={chat.id}
      className={cn(
        'group rounded-lg transition-colors',
        currentChatId === chat.id ? 'bg-accent/50 hover:bg-accent/60' : 'hover:bg-accent/30'
      )}
    >
      <div className="flex flex-col p-3 cursor-pointer" onClick={() => switchChat(chat.id)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {chat.pinned ? (
              <Pin className="h-3.5 w-3.5 shrink-0 text-primary" />
            ) : (
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            {editingChatId === chat.id ? (
              <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle(chat.id)
                    else if (e.key === 'Escape') handleCancelEdit()
                  }}
                />
                <button onClick={() => handleSaveTitle(chat.id)} className="p-1 hover:bg-background rounded">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={handleCancelEdit} className="p-1 hover:bg-background rounded">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <span className="text-sm font-medium truncate">{chat.title}</span>
            )}
          </div>
          {!editingChatId && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Chat options"
                    className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onSelect={() => togglePinChat(chat.id)}>
                    {chat.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    {chat.pinned ? 'Unpin' : 'Pin to top'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleEditTitle(chat)}>
                    <Edit2 className="h-3.5 w-3.5" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { setTaggingChatId(chat.id); setTagInput('') }}>
                    <Tag className="h-3.5 w-3.5" />
                    Add tag
                  </DropdownMenuItem>
                  {folderList.length > 0 && <DropdownMenuSeparator />}
                  {folderList.length > 0 && <DropdownMenuLabel>Move to folder</DropdownMenuLabel>}
                  {folderList.map(folder => (
                    <DropdownMenuItem key={folder.id} onSelect={() => moveChatToFolder(chat.id, folder.id)}>
                      <Folder className="h-3.5 w-3.5" />
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                  {chat.folderId && (
                    <DropdownMenuItem onSelect={() => moveChatToFolder(chat.id, null)}>
                      <X className="h-3.5 w-3.5" />
                      Remove from folder
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onSelect={() => handleDeleteChat(chat)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {taggingChatId === chat.id && (
          <div className="mt-1.5 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Tag name"
              autoFocus
              className="flex-1 px-2 py-0.5 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag(chat.id)
                else if (e.key === 'Escape') setTaggingChatId(null)
              }}
            />
            <button onClick={() => handleAddTag(chat.id)} className="p-1 hover:bg-background rounded">
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {chat.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {chat.tags.map(tag => (
              <span
                key={tag}
                className="group/tag inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
              >
                {tag}
                <button
                  onClick={(e) => { e.stopPropagation(); removeTagFromChat(chat.id, tag) }}
                  className="opacity-0 group-hover/tag:opacity-100 hover:text-destructive"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 mt-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{formatDate(chat.lastUpdated)}</span>
        </div>
      </div>
    </div>
  )

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
          {pinnedChats.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground">
                <Pin className="h-3 w-3" /> Pinned
              </div>
              {pinnedChats.map(renderChatRow)}
            </div>
          )}

          {folderList.length > 0 && (
            <div className="mb-2 space-y-1">
              {folderList.map(folder => {
                const folderChats = chats.filter(c => !c.pinned && c.folderId === folder.id).sort(byRecency)
                const isCollapsed = collapsedFolders[folder.id]
                return (
                  <div key={folder.id}>
                    <div className="group flex items-center gap-1 rounded-md px-2 py-1 hover:bg-accent/30">
                      <button
                        onClick={() => toggleFolderCollapsed(folder.id)}
                        className="flex flex-1 items-center gap-1.5 text-left"
                      >
                        <ChevronRight className={cn('h-3 w-3 text-muted-foreground transition-transform', !isCollapsed && 'rotate-90')} />
                        <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                        {editingFolderId === folder.id ? (
                          <input
                            type="text"
                            value={editFolderName}
                            onChange={(e) => setEditFolderName(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="flex-1 px-1 py-0.5 text-xs bg-background border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                renameFolder(folder.id, editFolderName)
                                setEditingFolderId(null)
                              } else if (e.key === 'Escape') {
                                setEditingFolderId(null)
                              }
                            }}
                          />
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">
                            {folder.name} <span className="text-muted-foreground/60">({folderChats.length})</span>
                          </span>
                        )}
                      </button>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name) }}
                          className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
                          aria-label="Rename folder"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteFolder(folder)}
                          className="p-1 hover:bg-background rounded text-muted-foreground hover:text-destructive"
                          aria-label="Delete folder"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {!isCollapsed && (
                      <div className="ml-3 space-y-1 border-l border-border pl-1">
                        {folderChats.length === 0 ? (
                          <p className="px-3 py-1.5 text-xs text-muted-foreground">Empty folder</p>
                        ) : (
                          folderChats.map(renderChatRow)
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium text-muted-foreground">Chats</span>
            <button
              onClick={handleCreateFolder}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              title="New folder"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          </div>
          {ungroupedChats.map(renderChatRow)}
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
