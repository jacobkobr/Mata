import { create } from 'zustand'
import { createOllamaProvider, createChatGPTProvider, type Provider } from '@mata/provider-core'
import { useSettingsStore } from './settings-store'

// Separate Provider instances from chat-store's — both are thin stateless
// wrappers over fetch/IPC, so there's no cost to having two, and it keeps
// compare mode fully independent of the regular chat's in-flight state.
const ollamaProvider = createOllamaProvider()
const chatGPTProvider: Provider | null =
  typeof window !== 'undefined' && window.electron ? createChatGPTProvider(window.electron.chatgpt) : null

export interface ComparisonSlot {
  providerId: 'ollama' | 'chatgpt'
  modelId: string
  label: string
  content: string
  isLoading: boolean
  error: string | null
}

function defaultSlot(providerId: 'ollama' | 'chatgpt', modelId: string, label: string): ComparisonSlot {
  return { providerId, modelId, label, content: '', isLoading: false, error: null }
}

interface CompareState {
  isOpen: boolean
  prompt: string
  slotA: ComparisonSlot
  slotB: ComparisonSlot
  open: () => void
  close: () => void
  setPrompt: (prompt: string) => void
  setSlot: (which: 'A' | 'B', providerId: 'ollama' | 'chatgpt', modelId: string, label: string) => void
  run: () => Promise<void>
  stop: () => void
}

function providerFor(providerId: 'ollama' | 'chatgpt'): Provider | null {
  return providerId === 'ollama' ? ollamaProvider : chatGPTProvider
}

export const useCompareStore = create<CompareState>()((set, get) => {
  let controllerA: AbortController | null = null
  let controllerB: AbortController | null = null

  async function runSlot(which: 'A' | 'B', prompt: string) {
    const slot = which === 'A' ? get().slotA : get().slotB
    const provider = providerFor(slot.providerId)
    const setSlotState = (update: Partial<ComparisonSlot>) =>
      set((state) => ({ [which === 'A' ? 'slotA' : 'slotB']: { ...state[which === 'A' ? 'slotA' : 'slotB'], ...update } } as Partial<CompareState>))

    if (!provider) {
      setSlotState({ isLoading: false, error: 'This provider is not available.' })
      return
    }

    const controller = new AbortController()
    if (which === 'A') controllerA = controller
    else controllerB = controller

    setSlotState({ content: '', isLoading: true, error: null })

    try {
      let text = ''
      for await (const chunk of provider.generate({
        model: slot.modelId,
        messages: [{ role: 'user', content: prompt }],
        temperature: useSettingsStore.getState().temperature,
        maxTokens: useSettingsStore.getState().maxTokens,
        signal: controller.signal,
      })) {
        text = chunk.done ? chunk.text : text + chunk.text
        setSlotState({ content: text })
      }
      setSlotState({ isLoading: false })
    } catch (error) {
      if (controller.signal.aborted) {
        setSlotState({ isLoading: false })
        return
      }
      setSlotState({ isLoading: false, error: error instanceof Error ? error.message : 'Something went wrong.' })
    }
  }

  return {
    isOpen: false,
    prompt: '',
    slotA: defaultSlot('ollama', '', 'Pick a model'),
    slotB: defaultSlot('ollama', '', 'Pick a model'),

    open: () => set({ isOpen: true }),
    close: () => {
      controllerA?.abort()
      controllerB?.abort()
      set({ isOpen: false })
    },
    setPrompt: (prompt) => set({ prompt }),
    setSlot: (which, providerId, modelId, label) => set((state) => ({
      [which === 'A' ? 'slotA' : 'slotB']: { ...defaultSlot(providerId, modelId, label) },
    } as Partial<CompareState>)),

    run: async () => {
      const prompt = get().prompt.trim()
      if (!prompt) return
      if (!get().slotA.modelId || !get().slotB.modelId) return
      await Promise.all([runSlot('A', prompt), runSlot('B', prompt)])
    },

    stop: () => {
      controllerA?.abort()
      controllerB?.abort()
    },
  }
})
