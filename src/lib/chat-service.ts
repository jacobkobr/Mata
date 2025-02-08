import type { DBChat, DBMessage } from './db-service'

export async function getAllChats(): Promise<DBChat[]> {
  const response = await fetch('/api/chats')
  if (!response.ok) {
    throw new Error('Failed to fetch chats')
  }
  return response.json()
}

export async function createChat(chat: DBChat): Promise<void> {
  const response = await fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', chat }),
  })
  if (!response.ok) {
    throw new Error('Failed to create chat')
  }
}

export async function updateChat(chat: DBChat): Promise<void> {
  const response = await fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', chat }),
  })
  if (!response.ok) {
    throw new Error('Failed to update chat')
  }
}

export async function deleteChat(chatId: string): Promise<void> {
  const response = await fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', chatId }),
  })
  if (!response.ok) {
    throw new Error('Failed to delete chat')
  }
}

export async function getChatMessages(chatId: string): Promise<DBMessage[]> {
  const response = await fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getMessages', chatId }),
  })
  if (!response.ok) {
    throw new Error('Failed to fetch messages')
  }
  return response.json()
}

export async function addMessage(message: DBMessage): Promise<void> {
  const response = await fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addMessage', message }),
  })
  if (!response.ok) {
    throw new Error('Failed to add message')
  }
} 