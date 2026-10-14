'use client'

import { useEffect, useState } from 'react'
import { useBookmarkStore } from '@/store/bookmark-store'
import { useRailStore, RAIL_ACCENT_HEX } from '@/store/rail-store'
import type { Message } from '@/store/chat-store'
import { cn } from '@/lib/utils'

export interface MessageRailProps {
  messages: Message[]
  activeId: string | null
  onNavigate: (id: string) => void
  /** modifier-held + click on a marker toggles a bookmark instead of navigating. */
  onToggleBookmark: (id: string) => void
}

// Mirrors chatmap's own railHeight constants: ~14px per message (18px in the
// "Large" size), capped as a fraction of the viewport so the rail stays
// compact for short chats and never overflows the screen for long ones.
const MIN_MESSAGES_FOR_HEIGHT = 6
const MAX_HEIGHT_RATIO = 0.7

export function MessageRail({ messages, activeId, onNavigate, onToggleBookmark }: MessageRailProps) {
  const bookmarks = useBookmarkStore((state) => state.bookmarks)
  const {
    enabled,
    bookmarksOnly,
    markerSize,
    showUserMessages,
    showAssistantMessages,
    accentColor,
    keybinds,
  } = useRailStore()
  const [viewportHeight, setViewportHeight] = useState(800)

  useEffect(() => {
    const update = () => setViewportHeight(window.innerHeight)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const visible = messages.filter((m) => {
    if (m.role === 'user' && !showUserMessages) return false
    if (m.role === 'assistant' && !showAssistantMessages) return false
    if (m.role !== 'user' && m.role !== 'assistant') return false
    if (bookmarksOnly && !bookmarks[m.id]) return false
    return true
  })

  if (!enabled || visible.length < 6) return null

  const pxPerMessage = markerSize === 'large' ? 18 : 14
  const railHeight = Math.min(
    Math.max(visible.length, MIN_MESSAGES_FOR_HEIGHT) * pxPerMessage,
    viewportHeight * MAX_HEIGHT_RATIO
  )
  const accentHex = RAIL_ACCENT_HEX[accentColor]

  return (
    <div className="hidden w-5 shrink-0 md:flex md:items-center">
      <div
        className="sticky top-1/2 flex w-full -translate-y-1/2 flex-col justify-between"
        style={{ height: railHeight }}
      >
        {visible.map((message) => {
          const isActive = message.id === activeId
          const bookmark = bookmarks[message.id]

          return (
            <button
              key={message.id}
              onClick={(e) => {
                const wantsBookmarkToggle =
                  e.altKey === keybinds.addEditBookmark.alt &&
                  e.shiftKey === keybinds.addEditBookmark.shift &&
                  e.ctrlKey === keybinds.addEditBookmark.ctrl &&
                  e.metaKey === keybinds.addEditBookmark.meta &&
                  (keybinds.addEditBookmark.alt || keybinds.addEditBookmark.shift || keybinds.addEditBookmark.ctrl || keybinds.addEditBookmark.meta)
                if (wantsBookmarkToggle) {
                  onToggleBookmark(message.id)
                } else {
                  onNavigate(message.id)
                }
              }}
              title={message.content.slice(0, 80)}
              aria-label="Jump to message"
              className={cn(
                'mx-auto shrink-0 rounded-full transition-all hover:scale-x-125',
                markerSize === 'large' ? 'h-1 w-5' : 'h-[3px] w-4',
                message.role === 'user' ? 'bg-primary/40' : 'bg-muted-foreground/40'
              )}
              style={{
                backgroundColor: bookmark ? bookmark.color : isActive ? accentHex : undefined,
                height: isActive ? (markerSize === 'large' ? 5 : 4) : undefined,
                width: isActive ? (markerSize === 'large' ? 24 : 20) : undefined,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
