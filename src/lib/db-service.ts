import Database from 'better-sqlite3'
import { join } from 'path'
import { Message } from '@/store/chat-store'

// Initialize database in user's app data
const DB_PATH = join(process.env.APPDATA || process.env.HOME || '.', '.mata', 'chats.db')

let db: Database.Database

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

export function initDatabase() {
  try {
    db = new Database(DB_PATH)
    
    // Create tables if they don't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        modelId TEXT NOT NULL,
        lastUpdated INTEGER NOT NULL,
        createdAt INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chatId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        modelId TEXT,
        FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE
      );
    `)

    // Enable foreign keys
    db.pragma('foreign_keys = ON')

    return true
  } catch (error) {
    console.error('Failed to initialize database:', error)
    return false
  }
}

// Chat operations
export function createChat(chat: DBChat) {
  const stmt = db.prepare(`
    INSERT INTO chats (id, title, modelId, lastUpdated, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `)
  
  stmt.run(
    chat.id,
    chat.title,
    chat.modelId,
    chat.lastUpdated,
    chat.createdAt
  )
}

export function updateChat(chat: DBChat) {
  const stmt = db.prepare(`
    UPDATE chats
    SET title = ?, modelId = ?, lastUpdated = ?
    WHERE id = ?
  `)
  
  stmt.run(chat.title, chat.modelId, chat.lastUpdated, chat.id)
}

export function deleteChat(chatId: string) {
  const stmt = db.prepare('DELETE FROM chats WHERE id = ?')
  stmt.run(chatId)
}

export function getAllChats(): DBChat[] {
  const stmt = db.prepare('SELECT * FROM chats ORDER BY lastUpdated DESC')
  return stmt.all() as DBChat[]
}

export function getChat(chatId: string): DBChat | undefined {
  const stmt = db.prepare('SELECT * FROM chats WHERE id = ?')
  return stmt.get(chatId) as DBChat | undefined
}

// Message operations
export function addMessage(message: DBMessage) {
  const stmt = db.prepare(`
    INSERT INTO messages (id, chatId, role, content, timestamp, modelId)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  
  stmt.run(
    message.id,
    message.chatId,
    message.role,
    message.content,
    message.timestamp,
    message.modelId
  )
}

export function getChatMessages(chatId: string): DBMessage[] {
  const stmt = db.prepare('SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp ASC')
  return stmt.all(chatId) as DBMessage[]
}

// Initialize database on import
initDatabase() 