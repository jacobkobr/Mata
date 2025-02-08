import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AI_MODELS, DEFAULT_MODEL, LOCAL_STORAGE_KEYS } from '@/lib/config'

type ModelId = typeof AI_MODELS[number]['id']

interface Settings {
  selectedModel: ModelId
  temperature: number
  maxTokens: number
  isPopoutMode: boolean
  shortcuts: {
    toggleWindow: string
    newChat: string
    focusInput: string
    toggleTheme: string
  }
}

interface SettingsState extends Settings {
  updateSettings: (settings: Partial<Settings>) => void
  resetSettings: () => void
}

const DEFAULT_SETTINGS: Settings = {
  selectedModel: DEFAULT_MODEL,
  temperature: 0.7,
  maxTokens: 2048,
  isPopoutMode: false,
  shortcuts: {
    toggleWindow: 'ctrl+shift+m',
    newChat: 'ctrl+n',
    focusInput: '/',
    toggleTheme: 'ctrl+shift+l',
  },
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: LOCAL_STORAGE_KEYS.settings,
    }
  )
) 