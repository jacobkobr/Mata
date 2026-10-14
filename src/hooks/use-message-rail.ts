import { useCallback, useEffect, useRef, useState } from 'react'
import { useRailStore } from '@/store/rail-store'

const CLICK_LOCK_MS = 700
const HIGHLIGHT_MS = 1200

/**
 * Tracks per-message DOM refs inside a scrollable container and reports which
 * message currently sits in a "reading line" band near the top of the
 * viewport, plus a way to smooth-scroll to any message by id.
 *
 * Deliberately much simpler than DOM-scraping tools built against a foreign
 * page (e.g. a browser extension overlaying chatgpt.com): Mata renders its
 * own messages directly, with stable refs and no virtualization to fight, so
 * a plain IntersectionObserver over real elements is enough.
 */
export function useMessageRail(messageIds: string[]) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const messageRefs = useRef(new Map<string, HTMLDivElement>())
  const [activeId, setActiveId] = useState<string | null>(null)
  // While true, the passive scroll-position tracker below won't override
  // activeId — a click is a deliberate, authoritative choice of "active,"
  // and the reading-line heuristic shouldn't fight it mid-scroll.
  const clickLockRef = useRef(false)
  const clickLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reducedMotion = useRailStore((state) => state.reducedMotion)
  const highlightOnJump = useRailStore((state) => state.highlightOnJump)

  const registerMessageRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) messageRefs.current.set(id, el)
    else messageRefs.current.delete(id)
  }, [])

  const scrollToMessage = useCallback((id: string) => {
    const el = messageRefs.current.get(id)
    if (!el) return

    clickLockRef.current = true
    setActiveId(id)
    el.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'center' })

    if (clickLockTimerRef.current) clearTimeout(clickLockTimerRef.current)
    clickLockTimerRef.current = setTimeout(() => {
      clickLockRef.current = false
    }, CLICK_LOCK_MS)

    if (highlightOnJump) {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
      el.classList.add('message-rail-highlight')
      highlightTimerRef.current = setTimeout(() => {
        el.classList.remove('message-rail-highlight')
      }, HIGHLIGHT_MS)
    }
  }, [reducedMotion, highlightOnJump])

  // A real user scroll gesture should immediately hand control back to the
  // passive tracker, even mid-lock.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const release = () => {
      clickLockRef.current = false
    }
    container.addEventListener('wheel', release, { passive: true })
    container.addEventListener('touchstart', release, { passive: true })
    return () => {
      container.removeEventListener('wheel', release)
      container.removeEventListener('touchstart', release)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (clickLockRef.current) return
        const intersecting = entries.filter((entry) => entry.isIntersecting)
        if (intersecting.length === 0) return
        intersecting.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const id = intersecting[0].target.getAttribute('data-message-id')
        if (id) setActiveId(id)
      },
      // Narrow band near the top of the viewport — whichever message crosses
      // it is "what the user is reading."
      { root: container, rootMargin: '-15% 0px -75% 0px', threshold: 0 }
    )

    messageRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
    // Re-observe when the set of messages changes (new/removed), not on every
    // render — message ids stay stable while an assistant reply streams in,
    // so this avoids tearing the observer down on every chunk.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageIds.join('|')])

  return { containerRef, registerMessageRef, scrollToMessage, activeId }
}
