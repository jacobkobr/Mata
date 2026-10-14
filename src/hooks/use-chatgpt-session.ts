import { useEffect, useState } from 'react'
import type { SessionState } from '@siwc/local'

const DISCONNECTED: SessionState = { status: 'disconnected', sharing: false }

/** Subscribes to the main process's ChatGPT session state. Electron-only — returns
 * the disconnected state with isAvailable: false outside Electron (e.g. the web build). */
export function useChatGPTSession() {
  const isAvailable = typeof window !== 'undefined' && !!window.electron
  const [session, setSession] = useState<SessionState>(DISCONNECTED)

  useEffect(() => {
    if (!isAvailable) return

    let unsubscribe: (() => void) | undefined
    window.electron.chatgpt.getSession().then(setSession).catch(() => {})
    unsubscribe = window.electron.chatgpt.onSessionChanged(setSession)

    return () => unsubscribe?.()
  }, [isAvailable])

  return { session, isAvailable }
}
