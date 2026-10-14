import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RailKeybind {
  alt: boolean
  shift: boolean
  ctrl: boolean
  meta: boolean
  /** Omitted for modifier-only binds (triggered by click or scroll, not a key). */
  key?: string
}

export type RailAccentColor = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'gray'

export const RAIL_ACCENT_HEX: Record<RailAccentColor, string> = {
  purple: '#8b5cf6',
  blue: '#3b82f6',
  green: '#22c55e',
  orange: '#f97316',
  pink: '#ec4899',
  gray: '#6b7280',
}

export interface RailKeybinds {
  addEditBookmark: RailKeybind
  quickBookmark: RailKeybind
  nextBookmark: RailKeybind
  prevBookmark: RailKeybind
  scrollNav: RailKeybind
  toggleBookmarksOnly: RailKeybind
  exportBookmarks: RailKeybind
}

interface RailSettings {
  enabled: boolean
  reducedMotion: boolean
  highlightOnJump: boolean
  bookmarksOnly: boolean
  markerSize: 'normal' | 'large'
  showUserMessages: boolean
  showAssistantMessages: boolean
  accentColor: RailAccentColor
  quickBookmarkColor: string
  keybinds: RailKeybinds
}

interface RailState extends RailSettings {
  updateRailSettings: (settings: Partial<RailSettings>) => void
  updateKeybind: (name: keyof RailKeybinds, bind: RailKeybind) => void
  resetKeybinds: () => void
}

const DEFAULT_KEYBINDS: RailKeybinds = {
  addEditBookmark: { alt: true, shift: true, ctrl: false, meta: false },
  quickBookmark: { alt: false, shift: false, ctrl: false, meta: false, key: 'b' },
  nextBookmark: { alt: true, shift: true, ctrl: false, meta: false, key: 's' },
  prevBookmark: { alt: true, shift: true, ctrl: false, meta: false, key: 'w' },
  scrollNav: { alt: true, shift: true, ctrl: false, meta: false },
  toggleBookmarksOnly: { alt: true, shift: true, ctrl: false, meta: false, key: 'h' },
  exportBookmarks: { alt: true, shift: true, ctrl: false, meta: false, key: 'e' },
}

const DEFAULT_SETTINGS: RailSettings = {
  enabled: true,
  reducedMotion: false,
  highlightOnJump: true,
  bookmarksOnly: false,
  markerSize: 'normal',
  showUserMessages: true,
  showAssistantMessages: true,
  accentColor: 'purple',
  quickBookmarkColor: '#ec4899',
  keybinds: DEFAULT_KEYBINDS,
}

export const useRailStore = create<RailState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      updateRailSettings: (settings) => set((state) => ({ ...state, ...settings })),
      updateKeybind: (name, bind) => set((state) => ({
        keybinds: { ...state.keybinds, [name]: bind }
      })),
      resetKeybinds: () => set({ keybinds: DEFAULT_KEYBINDS }),
    }),
    {
      name: 'mata:message-rail-settings',
    }
  )
)

export function matchesKeybind(e: { altKey: boolean; shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; key?: string }, bind: RailKeybind): boolean {
  if (e.altKey !== bind.alt || e.shiftKey !== bind.shift || e.ctrlKey !== bind.ctrl || e.metaKey !== bind.meta) {
    return false
  }
  if (bind.key) {
    return e.key?.toLowerCase() === bind.key.toLowerCase()
  }
  return true
}

export function formatKeybind(bind: RailKeybind, suffix?: string): string {
  const parts: string[] = []
  if (bind.ctrl) parts.push('Ctrl')
  if (bind.alt) parts.push('Alt')
  if (bind.shift) parts.push('Shift')
  if (bind.meta) parts.push('Cmd')
  if (bind.key) parts.push(bind.key.toUpperCase())
  else if (suffix) parts.push(suffix)
  return parts.join(' + ')
}
