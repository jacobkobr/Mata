import type { DBMessage } from './types'
import type { Message } from '@/store/chat-store'

interface IndexEntry {
  id: string
  chatId: string
  content: string
  timestamp: number
  role: 'user' | 'assistant' | 'error'
  tokens: string[]
  embedding?: number[]
}

interface SearchResult {
  message: Message
  score: number
}

class ChatIndex {
  private index: Map<string, IndexEntry>
  private static instance: ChatIndex

  private constructor() {
    this.index = new Map()
  }

  static getInstance(): ChatIndex {
    if (!ChatIndex.instance) {
      ChatIndex.instance = new ChatIndex()
    }
    return ChatIndex.instance
  }

  // Basic tokenization (can be enhanced with better NLP)
  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0)
  }

  // Add a message to the index
  async addToIndex(message: DBMessage): Promise<void> {
    const tokens = this.tokenize(message.content)
    const entry: IndexEntry = {
      id: message.id,
      chatId: message.chatId,
      content: message.content,
      timestamp: message.timestamp,
      role: message.role as 'user' | 'assistant' | 'error',
      tokens
    }
    this.index.set(message.id, entry)
  }

  // Remove a message from the index
  removeFromIndex(messageId: string): void {
    this.index.delete(messageId)
  }

  // Clear all entries for a specific chat
  clearChat(chatId: string): void {
    Array.from(this.index.keys()).forEach(messageId => {
      const entry = this.index.get(messageId)
      if (entry && entry.chatId === chatId) {
        this.index.delete(messageId)
      }
    })
  }

  // Clear the entire index
  clearAll(): void {
    this.index.clear()
  }

  // Search the index using TF-IDF scoring
  search(query: string, limit: number = 5): SearchResult[] {
    const queryTokens = this.tokenize(query)
    const results: SearchResult[] = []

    // Calculate document frequencies
    const df: Map<string, number> = new Map()
    for (const token of queryTokens) {
      let count = 0
      Array.from(this.index.values()).forEach(entry => {
        if (entry.tokens.includes(token)) {
          count++
        }
      })
      df.set(token, count)
    }

    // Calculate scores for each document
    Array.from(this.index.values()).forEach(entry => {
      let score = 0
      const tf: Map<string, number> = new Map()

      // Calculate term frequencies
      for (const token of entry.tokens) {
        tf.set(token, (tf.get(token) || 0) + 1)
      }

      // Calculate TF-IDF score
      for (const token of queryTokens) {
        const termFreq = tf.get(token) || 0
        const docFreq = df.get(token) || 0
        if (docFreq > 0) {
          const idf = Math.log(this.index.size / docFreq)
          score += (termFreq * idf)
        }
      }

      if (score > 0) {
        results.push({
          message: {
            id: entry.id,
            chatId: entry.chatId,
            content: entry.content,
            timestamp: entry.timestamp,
            role: entry.role,
          } as Message,
          score
        })
      }
    })

    // Sort by score and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  // Get statistics about the index
  getStats() {
    return {
      totalDocuments: this.index.size,
      totalTokens: Array.from(this.index.values())
        .reduce((sum, entry) => sum + entry.tokens.length, 0)
    }
  }
}

// Export a singleton instance
export const chatIndex = ChatIndex.getInstance()

// Export helper functions for easier usage
export async function indexMessage(message: DBMessage): Promise<void> {
  return chatIndex.addToIndex(message)
}

export function searchMessages(query: string, limit?: number): SearchResult[] {
  return chatIndex.search(query, limit)
}

export function clearChatIndex(chatId: string): void {
  chatIndex.clearChat(chatId)
}

export function clearAllIndices(): void {
  chatIndex.clearAll()
}

export function getIndexStats() {
  return chatIndex.getStats()
} 