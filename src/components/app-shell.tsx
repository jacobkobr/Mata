'use client'

import { Columns2 } from 'lucide-react'
import { TitleBar } from '@/components/title-bar'
import { ThemeToggle } from '@/components/theme-toggle'
import { SettingsPanel } from '@/components/settings-panel'
import { CompareModal } from '@/components/compare/compare-modal'
import { useCompareStore } from '@/store/compare-store'
import { useWindowMode } from '@/hooks/use-window-mode'

export function AppShell({ children }: { children: React.ReactNode }) {
  const windowMode = useWindowMode()
  const openCompare = useCompareStore((state) => state.open)
  // Compact and quick-ask are their own frameless, chrome-less windows —
  // the main window's title bar and settings/theme buttons don't belong there.
  const isFramelessChildWindow = windowMode === 'compact' || windowMode === 'quickask'

  return (
    <>
      {!isFramelessChildWindow && <TitleBar />}
      {!isFramelessChildWindow && (
        <div className="fixed top-12 right-4 z-50 flex items-center gap-2">
          <button
            onClick={openCompare}
            className="p-2 rounded-md hover:bg-accent"
            aria-label="Compare models"
            title="Compare models side by side"
          >
            <Columns2 className="h-5 w-5" />
          </button>
          <SettingsPanel />
          <ThemeToggle />
        </div>
      )}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
      {!isFramelessChildWindow && <CompareModal />}
    </>
  )
}
