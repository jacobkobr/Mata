export interface DBChat {
  id: string
  title: string
  modelId: string
  lastUpdated: number
  createdAt: number
  /** Added for folders/tags/pins — absent on chats created before that feature, treat as false/[]/null. */
  pinned?: boolean
  tags?: string[]
  folderId?: string | null
}

export interface DBMessage {
  id: string
  chatId: string
  role: string
  content: string
  timestamp: number
  modelId?: string
}

export interface DBFolder {
  id: string
  name: string
  color?: string
  createdAt: number
} 