import { useEffect } from 'react'
import { useSettingsStore } from '@/store/settings-store'

interface ShortcutHandlers {
  toggleWindow?: () => void
  newChat?: () => void
  focusInput?: () => void
  toggleTheme?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const shortcuts = useSettingsStore((state) => state.shortcuts)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Don't trigger shortcuts when typing in input fields — notably, this
      // used to carve out an exception letting '/' trigger focusInput even
      // while already focused on an empty composer, which ate the character
      // before it could ever land in the textarea. That made it impossible
      // to type a slash command as the first character of a message, so the
      // carve-out is gone: refocusing an already-focused element was a
      // no-op anyway.
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      const pressedKey = [
        event.ctrlKey && 'ctrl',
        event.shiftKey && 'shift',
        event.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('+')

      // Handle shortcuts
      if (pressedKey === shortcuts.toggleWindow && handlers.toggleWindow) {
        event.preventDefault()
        handlers.toggleWindow()
      } else if (pressedKey === shortcuts.newChat && handlers.newChat) {
        event.preventDefault()
        handlers.newChat()
      } else if (pressedKey === shortcuts.focusInput && handlers.focusInput) {
        event.preventDefault()
        handlers.focusInput()
      } else if (pressedKey === shortcuts.toggleTheme && handlers.toggleTheme) {
        event.preventDefault()
        handlers.toggleTheme()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, handlers])
} 