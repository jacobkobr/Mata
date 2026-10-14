interface SystemInfo {
  cpu: {
    manufacturer: string
    brand: string
    physicalCores: number
    cores: number
    speed: number
    speedMax: number
    architecture: string
    instructions: {
      avx: boolean
      avx2: boolean
    }
  }
  memory: {
    total: number
    free: number
    used: number
    active: number
    available: number
  }
  gpu: {
    vendor: string
    model: string
    vram: number
    driverVersion: string
    cuda: boolean
  } | null
}

interface ResourceUsage {
  cpu: {
    load: number
    loadPerCore: number[]
  }
  memory: {
    used: number
    active: number
    available: number
  }
  gpu: {
    load: number
    memoryUsed: number
    memoryTotal: number
  } | null
}

type IPCChannels =
  | 'get-system-info'
  | 'start-monitoring'
  | 'stop-monitoring'
  | 'minimize-window'
  | 'maximize-window'
  | 'close-window'
  | 'toggle-compact-mode'
  | 'get-window-mode'
  | 'toggle-quick-ask'
  | 'hide-quick-ask'
  | 'resize-quick-ask'

type IPCEvents = 
  | 'system-info'
  | 'resource-usage'
  | 'window-maximized'

import type { ChatGPTModel, LoginProfile, ResponseInputMessage, SessionState, SignInOptions } from '@siwc/local'

interface ElectronAPI {
  send<T = unknown>(channel: IPCChannels, ...args: any[]): Promise<T>
  receive(channel: IPCEvents, func: (...args: any[]) => void): void
  removeListener(channel: IPCEvents, func: (...args: any[]) => void): void
  storage: {
    getAllChats(): Promise<any>
    createChat(chat: any): Promise<any>
    updateChat(chat: any): Promise<any>
    deleteChat(chatId: string): Promise<any>
    getChatMessages(chatId: string): Promise<any>
    addMessage(message: any): Promise<any>
  }
  chatgpt: {
    signIn(options?: SignInOptions): Promise<SessionState>
    cancelSignIn(): Promise<void>
    signOut(): Promise<void>
    getSession(): Promise<SessionState>
    listProfiles(): Promise<LoginProfile[]>
    selectProfile(profileId: string): Promise<SessionState>
    listModels(): Promise<ChatGPTModel[]>
    streamResponse(payload: {
      requestId: string
      model: string
      input: string | ResponseInputMessage[]
      instructions?: string
    }): Promise<{ text: string }>
    cancelStream(requestId: string): Promise<void>
    onSessionChanged(callback: (session: SessionState) => void): () => void
    onStreamChunk(callback: (payload: { requestId: string; delta: string }) => void): () => void
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export { SystemInfo, ResourceUsage, ElectronAPI, IPCChannels, IPCEvents } 