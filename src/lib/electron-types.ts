import type { DBChat, DBMessage } from './types'

export interface ElectronWindow {
  // Window controls
  send: (channel: string) => Promise<boolean>
  receive: (channel: string, func: (...args: any[]) => void) => void
  removeListener: (channel: string, func: (...args: any[]) => void) => void
  // Storage methods
  storage: {
    getAllChats: () => Promise<DBChat[]>
    createChat: (chat: DBChat) => Promise<boolean>
    updateChat: (chat: DBChat) => Promise<boolean>
    deleteChat: (chatId: string) => Promise<boolean>
    getChatMessages: (chatId: string) => Promise<DBMessage[]>
    addMessage: (message: DBMessage) => Promise<boolean>
  }
}

declare global {
  interface Window {
    electron: ElectronWindow
  }
} 