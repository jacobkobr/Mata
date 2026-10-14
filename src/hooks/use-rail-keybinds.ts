import { useEffect } from 'react'
import { useRailStore, matchesKeybind } from '@/store/rail-store'
import { useBookmarkStore } from '@/store/bookmark-store'
import { useRailUIStore } from '@/store/rail-ui-store'
import type { Message } from '@/store/chat-store'

interface Options {
  messages: Message[]
  activeId: string | null
  scrollToMessage: (id: string) => void
}

export function useRailKeybinds({ messages, activeId, scrollToMessage }: Options) {
  const keybinds = useRailStore((state) => state.keybinds)
  const railEnabled = useRailStore((state) => state.enabled)
  const quickBookmarkColor = useRailStore((state) => state.quickBookmarkColor)
  const bookmarksOnly = useRailStore((state) => state.bookmarksOnly)
  const updateRailSettings = useRailStore((state) => state.updateRailSettings)
  const bookmarks = useBookmarkStore((state) => state.bookmarks)
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark)
  const openExportDialog = useRailUIStore((state) => state.openExportDialog)

  useEffect(() => {
    if (!railEnabled) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (matchesKeybind(e, keybinds.exportBookmarks)) {
        e.preventDefault()
        openExportDialog()
        return
      }
      if (matchesKeybind(e, keybinds.toggleBookmarksOnly)) {
        e.preventDefault()
        updateRailSettings({ bookmarksOnly: !bookmarksOnly })
        return
      }
      if (activeId && matchesKeybind(e, keybinds.quickBookmark)) {
        e.preventDefault()
        toggleBookmark(activeId, quickBookmarkColor)
        return
      }

      const isNext = matchesKeybind(e, keybinds.nextBookmark)
      const isPrev = !isNext && matchesKeybind(e, keybinds.prevBookmark)
      if (isNext || isPrev) {
        const bookmarkedIds = messages.filter((m) => bookmarks[m.id]).map((m) => m.id)
        if (bookmarkedIds.length === 0) return
        e.preventDefault()
        const currentIndex = activeId ? bookmarkedIds.indexOf(activeId) : -1
        const nextIndex =
          currentIndex === -1
            ? isNext ? 0 : bookmarkedIds.length - 1
            : isNext
              ? (currentIndex + 1) % bookmarkedIds.length
              : (currentIndex - 1 + bookmarkedIds.length) % bookmarkedIds.length
        scrollToMessage(bookmarkedIds[nextIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [railEnabled, keybinds, activeId, messages, bookmarks, bookmarksOnly, quickBookmarkColor, toggleBookmark, updateRailSettings, openExportDialog, scrollToMessage])

  useEffect(() => {
    if (!railEnabled) return
    const bind = keybinds.scrollNav
    const hasModifier = bind.alt || bind.shift || bind.ctrl || bind.meta
    if (!hasModifier) return

    function handleWheel(e: WheelEvent) {
      if (e.altKey !== bind.alt || e.shiftKey !== bind.shift || e.ctrlKey !== bind.ctrl || e.metaKey !== bind.meta) return
      const ids = messages.map((m) => m.id)
      if (ids.length === 0) return
      e.preventDefault()
      const currentIndex = activeId ? ids.indexOf(activeId) : -1
      const direction = e.deltaY > 0 ? 1 : -1
      const nextIndex = Math.min(ids.length - 1, Math.max(0, (currentIndex === -1 ? 0 : currentIndex) + direction))
      scrollToMessage(ids[nextIndex])
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [railEnabled, keybinds.scrollNav, messages, activeId, scrollToMessage])
}
