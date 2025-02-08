export interface DBChat {
  id: string
  title: string
  modelId: string
  lastUpdated: number
  createdAt: number
}

export interface DBMessage {
  id: string
  chatId: string
  role: string
  content: string
  timestamp: number
  modelId?: string
} 