import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MessageBookmark {
  color: string
  createdAt: number
}

interface BookmarkState {
  bookmarks: Record<string, MessageBookmark>
  toggleBookmark: (messageId: string, color: string) => void
  isBookmarked: (messageId: string) => boolean
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: {},
      toggleBookmark: (messageId, color) => set((state) => {
        const next = { ...state.bookmarks }
        if (next[messageId]) {
          delete next[messageId]
        } else {
          next[messageId] = { color, createdAt: Date.now() }
        }
        return { bookmarks: next }
      }),
      isBookmarked: (messageId) => !!get().bookmarks[messageId],
    }),
    {
      name: 'mata:bookmarks',
      // v1 stored a plain Record<string, true>; drop it rather than carry a
      // shape migration for a feature that's still this new.
      version: 2,
    }
  )
)
