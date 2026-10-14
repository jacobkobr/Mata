'use client'

import { useEffect, useRef, useState } from 'react'
import { Map, Download } from 'lucide-react'
import {
  useRailStore,
  RAIL_ACCENT_HEX,
  formatKeybind,
  type RailAccentColor,
  type RailKeybind,
  type RailKeybinds,
} from '@/store/rail-store'
import { useRailUIStore } from '@/store/rail-ui-store'
import { ToggleField } from '@/components/ui/toggle-field'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ACCENT_OPTIONS: RailAccentColor[] = ['purple', 'blue', 'green', 'orange', 'pink', 'gray']

const KEYBIND_ROWS: { key: keyof RailKeybinds; label: string; allowModifierOnly?: boolean }[] = [
  { key: 'addEditBookmark', label: 'Add / edit bookmark (modifier + click marker)', allowModifierOnly: true },
  { key: 'quickBookmark', label: 'Quick-bookmark active message' },
  { key: 'nextBookmark', label: 'Jump to next bookmark' },
  { key: 'prevBookmark', label: 'Jump to previous bookmark' },
  { key: 'scrollNav', label: 'Step through messages (modifier + scroll)', allowModifierOnly: true },
  { key: 'toggleBookmarksOnly', label: 'Toggle bookmarks-only view' },
  { key: 'exportBookmarks', label: 'Export bookmarks' },
]

function KeybindRecorder({
  bind,
  onChange,
  allowModifierOnly,
}: {
  bind: RailKeybind
  onChange: (next: RailKeybind) => void
  allowModifierOnly?: boolean
}) {
  const [listening, setListening] = useState(false)
  const pendingRef = useRef<RailKeybind>(bind)

  useEffect(() => {
    if (!listening) return

    function finalize(next: RailKeybind) {
      onChange(next)
      setListening(false)
    }

    function handleKeyDown(e: KeyboardEvent) {
      e.preventDefault()
      const isModifierKey = ['Alt', 'Shift', 'Control', 'Meta'].includes(e.key)
      const next: RailKeybind = {
        alt: e.altKey,
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        key: isModifierKey ? undefined : e.key.toLowerCase(),
      }
      pendingRef.current = next
      if (!isModifierKey) finalize(next)
    }

    function handleKeyUp() {
      const pending = pendingRef.current
      const hasModifier = pending.alt || pending.shift || pending.ctrl || pending.meta
      if (allowModifierOnly && !pending.key && hasModifier) {
        finalize(pending)
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [listening, allowModifierOnly, onChange])

  return (
    <button
      type="button"
      onClick={() => setListening(true)}
      className={cn(
        'min-w-[9rem] rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
        listening ? 'border-primary text-primary' : 'border-border text-foreground hover:bg-accent'
      )}
    >
      {listening ? 'Press keys…' : formatKeybind(bind, allowModifierOnly ? 'Click' : undefined)}
    </button>
  )
}

export function MessageRailTab() {
  const {
    enabled,
    reducedMotion,
    highlightOnJump,
    bookmarksOnly,
    markerSize,
    showUserMessages,
    showAssistantMessages,
    accentColor,
    quickBookmarkColor,
    keybinds,
    updateRailSettings,
    updateKeybind,
    resetKeybinds,
  } = useRailStore()
  const openExportDialog = useRailUIStore((state) => state.openExportDialog)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          <h3 className="text-lg font-medium">General</h3>
        </div>

        <div className="space-y-1">
          <ToggleField
            label="Message rail"
            description="Show a compact minimap on the side of the chat for jumping between messages"
            checked={enabled}
            onCheckedChange={(checked) => updateRailSettings({ enabled: checked })}
          />
          <ToggleField
            label="Reduced motion"
            description="Jump to messages instantly instead of smooth-scrolling"
            checked={reducedMotion}
            onCheckedChange={(checked) => updateRailSettings({ reducedMotion: checked })}
          />
          <ToggleField
            label="Highlight on jump"
            description="Briefly highlight a message after navigating to it"
            checked={highlightOnJump}
            onCheckedChange={(checked) => updateRailSettings({ highlightOnJump: checked })}
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-4">
        <h3 className="text-sm font-medium text-muted-foreground">Markers</h3>

        <div className="space-y-1">
          <ToggleField
            label="Show your messages"
            checked={showUserMessages}
            onCheckedChange={(checked) => updateRailSettings({ showUserMessages: checked })}
          />
          <ToggleField
            label="Show assistant messages"
            checked={showAssistantMessages}
            onCheckedChange={(checked) => updateRailSettings({ showAssistantMessages: checked })}
          />
          <ToggleField
            label="Bookmarks only"
            description="Hide every marker except bookmarked messages"
            checked={bookmarksOnly}
            onCheckedChange={(checked) => updateRailSettings({ bookmarksOnly: checked })}
          />
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-foreground">Marker size</span>
          <div className="flex gap-1 rounded-md border border-border p-0.5">
            {(['normal', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => updateRailSettings({ markerSize: size })}
                className={cn(
                  'rounded px-3 py-1 text-xs font-medium capitalize transition-colors',
                  markerSize === size ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-foreground">Quick-bookmark color</span>
          <div className="flex gap-1.5">
            {ACCENT_OPTIONS.map((color) => (
              <button
                key={color}
                aria-label={color}
                onClick={() => updateRailSettings({ quickBookmarkColor: RAIL_ACCENT_HEX[color] })}
                className={cn(
                  'h-5 w-5 rounded-full ring-offset-2 ring-offset-card transition-shadow',
                  quickBookmarkColor === RAIL_ACCENT_HEX[color] && 'ring-2 ring-foreground'
                )}
                style={{ backgroundColor: RAIL_ACCENT_HEX[color] }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-4">
        <h3 className="text-sm font-medium text-muted-foreground">Appearance</h3>

        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-foreground">Accent color</span>
          <div className="flex gap-1.5">
            {ACCENT_OPTIONS.map((color) => (
              <button
                key={color}
                aria-label={color}
                onClick={() => updateRailSettings({ accentColor: color })}
                className={cn(
                  'h-5 w-5 rounded-full ring-offset-2 ring-offset-card transition-shadow',
                  accentColor === color && 'ring-2 ring-foreground'
                )}
                style={{ backgroundColor: RAIL_ACCENT_HEX[color] }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Shortcuts</h3>
          <Button variant="outline" size="sm" onClick={resetKeybinds}>Reset shortcuts</Button>
        </div>

        <div className="space-y-2">
          {KEYBIND_ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4 py-1">
              <span className="text-sm text-foreground">{row.label}</span>
              <KeybindRecorder
                bind={keybinds[row.key]}
                allowModifierOnly={row.allowModifierOnly}
                onChange={(next) => updateKeybind(row.key, next)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <Button variant="outline" className="w-full" onClick={openExportDialog}>
          <Download className="h-4 w-4" />
          Export bookmarks
        </Button>
      </div>
    </div>
  )
}
