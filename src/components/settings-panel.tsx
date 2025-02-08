'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Settings, X } from 'lucide-react'
import { AI_MODELS, KEYBOARD_SHORTCUTS } from '@/lib/config'
import { useSettingsStore } from '@/store/settings-store'
import { ModelManager } from './model-manager'
import { useChatStore } from '@/store/chat-store'

type ModelId = typeof AI_MODELS[number]['id']

export function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { temperature, maxTokens, shortcuts, updateSettings, resetSettings } = useSettingsStore()
  const { clearAllChats } = useChatStore()

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      clearAllChats()
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md hover:bg-accent"
        aria-label="Open settings"
      >
        <Settings className="h-5 w-5" />
      </button>

      {isOpen && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-[500px] h-[600px] bg-card shadow-lg rounded-lg border border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md hover:bg-accent"
                aria-label="Close settings"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Model Manager */}
              <ModelManager />

              {/* Temperature */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Temperature</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">{temperature}</div>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Tokens</label>
                <input
                  type="number"
                  min="1"
                  max="4096"
                  value={maxTokens}
                  onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value) })}
                  className="w-full p-2 rounded-md border border-input bg-background"
                />
              </div>

              {/* Keyboard Shortcuts */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Keyboard Shortcuts</label>
                {Object.entries(shortcuts).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">{key}</span>
                    <kbd className="px-2 py-1 text-xs bg-muted rounded">{value}</kbd>
                  </div>
                ))}
              </div>

              {/* Clear History */}
              <div className="pt-4 border-t border-border">
                <button
                  onClick={handleClearHistory}
                  className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90"
                >
                  Clear All Chat History
                </button>
              </div>

              {/* Reset Button */}
              <button
                onClick={resetSettings}
                className="w-full px-4 py-2 bg-destructive/10 text-destructive rounded-md hover:opacity-90"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
} 