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
  | 'add-message'
  | 'get-messages'
  | 'clear-messages'
  | 'get-settings'
  | 'update-settings'

type IPCEvents = 
  | 'system-info'
  | 'resource-usage'
  | 'window-maximized'

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
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

export { SystemInfo, ResourceUsage, ElectronAPI, IPCChannels, IPCEvents } 