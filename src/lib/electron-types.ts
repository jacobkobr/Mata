import type { DBChat, DBMessage } from './types'
import type { ChatGPTModel, LoginProfile, ResponseInputMessage, SessionState, SignInOptions } from '@siwc/local'

export interface ElectronWindow {
  // Window controls
  send: (channel: string, ...args: any[]) => Promise<any>
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
    updateMessage: (message: DBMessage) => Promise<boolean>
    deleteMessage: (messageId: string) => Promise<boolean>
  }
  // Sign in with ChatGPT — session state and chat text only, never tokens.
  chatgpt: {
    signIn: (options?: SignInOptions) => Promise<SessionState>
    cancelSignIn: () => Promise<void>
    signOut: () => Promise<void>
    getSession: () => Promise<SessionState>
    listProfiles: () => Promise<LoginProfile[]>
    selectProfile: (profileId: string) => Promise<SessionState>
    listModels: () => Promise<ChatGPTModel[]>
    streamResponse: (payload: {
      requestId: string
      model: string
      input: string | ResponseInputMessage[]
      instructions?: string
    }) => Promise<{ text: string }>
    cancelStream: (requestId: string) => Promise<void>
    onSessionChanged: (callback: (session: SessionState) => void) => () => void
    onStreamChunk: (callback: (payload: { requestId: string; delta: string }) => void) => () => void
  }
}

declare global {
  interface Window {
    electron: ElectronWindow
  }
} 