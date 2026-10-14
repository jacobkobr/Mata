import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AI_MODELS, DEFAULT_MODEL, LOCAL_STORAGE_KEYS } from '@/lib/config'

type ModelId = typeof AI_MODELS[number]['id']

interface ModelKnowledge {
  id: string
  content: string
  enabled: boolean
}

export interface AdvancedSettings {
  modelKnowledge: ModelKnowledge[]
  debugMode: boolean
}

interface Settings {
  selectedModel: ModelId
  /**
   * 'chatgpt' uses the signed-in ChatGPT plan via chatGPTModelSlug instead of the
   * Ollama catalog. 'auto' prefers the locally selected Ollama model when it's
   * actually installed and Ollama is running, and falls back to ChatGPT only
   * when it isn't (and never for messages with an image attached, since the
   * ChatGPT API this app uses can't accept images at all).
   */
  activeProvider: 'ollama' | 'chatgpt' | 'auto'
  chatGPTModelSlug?: string
  temperature: number
  maxTokens: number
  sidebarCollapsed: boolean
  shortcuts: {
    toggleWindow: string
    newChat: string
    focusInput: string
    toggleTheme: string
  }
  advancedSettings: AdvancedSettings
}

interface SettingsState extends Settings {
  updateSettings: (settings: Partial<Settings>) => void
  resetSettings: () => void
  addKnowledge: (content: string) => void
  removeKnowledge: (id: string) => void
  toggleKnowledge: (id: string) => void
  updateKnowledge: (id: string, content: string) => void
}

const DEFAULT_SETTINGS: Settings = {
  selectedModel: DEFAULT_MODEL,
  activeProvider: 'ollama',
  temperature: 0.7,
  maxTokens: 2048,
  sidebarCollapsed: false,
  shortcuts: {
    toggleWindow: 'ctrl+shift+m',
    newChat: 'ctrl+n',
    focusInput: '/',
    toggleTheme: 'ctrl+shift+l',
  },
  advancedSettings: {
    modelKnowledge: [],
    debugMode: false,
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
      resetSettings: () => set(DEFAULT_SETTINGS),
      addKnowledge: (content) => set((state) => ({
        ...state,
        advancedSettings: {
          ...state.advancedSettings,
          modelKnowledge: [
            ...state.advancedSettings.modelKnowledge,
            {
              id: Math.random().toString(36).substring(7),
              content: content.trim(),
              enabled: true
            }
          ]
        }
      })),
      removeKnowledge: (id) => set((state) => ({
        ...state,
        advancedSettings: {
          ...state.advancedSettings,
          modelKnowledge: state.advancedSettings.modelKnowledge.filter(k => k.id !== id)
        }
      })),
      toggleKnowledge: (id) => set((state) => ({
        ...state,
        advancedSettings: {
          ...state.advancedSettings,
          modelKnowledge: state.advancedSettings.modelKnowledge.map(k =>
            k.id === id ? { ...k, enabled: !k.enabled } : k
          )
        }
      })),
      updateKnowledge: (id, content) => set((state) => ({
        ...state,
        advancedSettings: {
          ...state.advancedSettings,
          modelKnowledge: state.advancedSettings.modelKnowledge.map(k =>
            k.id === id ? { ...k, content: content.trim() } : k
          )
        }
      }))
    }),
    {
      name: LOCAL_STORAGE_KEYS.settings,
    }
  )
) 