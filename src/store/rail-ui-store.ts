import { create } from 'zustand'

// Transient UI state for the message rail — not persisted. Separate from
// rail-store.ts, which holds the user's saved rail preferences.
interface RailUIState {
  exportDialogOpen: boolean
  openExportDialog: () => void
  closeExportDialog: () => void
}

export const useRailUIStore = create<RailUIState>()((set) => ({
  exportDialogOpen: false,
  openExportDialog: () => set({ exportDialogOpen: true }),
  closeExportDialog: () => set({ exportDialogOpen: false }),
}))
