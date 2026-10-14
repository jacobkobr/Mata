import { useEffect, useState } from 'react'

export type WindowMode = 'main' | 'compact' | 'quickask'

/**
 * Determines which of the app's frameless windows we're rendering inside.
 * Dev mode gets a real query string; the packaged build has no query string
 * on its file:// load, so main.js injects a global flag instead (see
 * loadProductionBuild in electron/main.js) — compact mode additionally has a
 * persistent main-process flag since it's toggled, not just summoned.
 */
export function useWindowMode(): WindowMode {
  const [mode, setMode] = useState<WindowMode>('main')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const quickAskFlag = (window as unknown as { isQuickAskMode?: boolean }).isQuickAskMode

    if (params.get('quickask') === 'true' || quickAskFlag === true) {
      setMode('quickask')
      return
    }
    if (params.get('compact') === 'true') {
      setMode('compact')
      return
    }
    if (window.electron) {
      window.electron.send('get-window-mode').then((isCompact) => {
        if (isCompact) setMode('compact')
      })
    }
  }, [])

  useEffect(() => {
    // These windows are created with a transparent Electron background —
    // the CSS layer's own opaque body background would otherwise paint
    // over that and hide the desktop behind them.
    if (mode === 'compact' || mode === 'quickask') {
      document.documentElement.style.background = 'transparent'
      document.body.style.background = 'transparent'
    }
  }, [mode])

  return mode
}
