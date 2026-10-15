import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

/**
 * Facts the model should remember about the user *across* conversations —
 * distinct from Settings > Knowledge, which is static text the user curates
 * up front. Memory facts get added while chatting (via "remember that..."
 * detection in chat-store, or the per-message "Save to memory" action) as
 * well as manually from the Memory settings tab, and every enabled fact is
 * injected into every future conversation regardless of which chat it came
 * from.
 */
export interface MemoryFact {
  id: string
  content: string
  enabled: boolean
  createdAt: number
  /** Where the fact came from, shown in the settings list so it's clear what's automatic vs. manual. */
  source: 'manual' | 'message' | 'detected'
}

interface MemoryState {
  memories: MemoryFact[]
  addMemory: (content: string, source?: MemoryFact['source']) => void
  removeMemory: (id: string) => void
  toggleMemory: (id: string) => void
  updateMemory: (id: string, content: string) => void
  clearAllMemories: () => void
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set) => ({
      memories: [],
      addMemory: (content, source = 'manual') => {
        const trimmed = content.trim()
        if (!trimmed) return
        set((state) => ({
          memories: [
            { id: uuidv4(), content: trimmed, enabled: true, createdAt: Date.now(), source },
            ...state.memories,
          ],
        }))
      },
      removeMemory: (id) => set((state) => ({ memories: state.memories.filter(m => m.id !== id) })),
      toggleMemory: (id) => set((state) => ({
        memories: state.memories.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m),
      })),
      updateMemory: (id, content) => set((state) => ({
        memories: state.memories.map(m => m.id === id ? { ...m, content: content.trim() } : m),
      })),
      clearAllMemories: () => set({ memories: [] }),
    }),
    {
      name: 'mata:memory',
    }
  )
)
