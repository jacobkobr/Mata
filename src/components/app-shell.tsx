'use client'

import { TitleBar } from '@/components/title-bar'
import { ThemeToggle } from '@/components/theme-toggle'
import { SettingsPanel } from '@/components/settings-panel'
import { useSettingsStore } from '@/store/settings-store'

export function AppShell({ children }: { children: React.ReactNode }) {
  const isPopoutMode = useSettingsStore((state) => state.isPopoutMode)

  return (
    <>
      <TitleBar />
      {!isPopoutMode && (
        <div className="fixed top-12 right-4 z-50 flex items-center gap-2">
          <SettingsPanel />
          <ThemeToggle />
        </div>
      )}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </>
  )
} 