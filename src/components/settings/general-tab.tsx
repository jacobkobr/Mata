import { Gauge } from 'lucide-react'
import { useSettingsStore } from '@/store/settings-store'
import { useChatStore } from '@/store/chat-store'
import { ToggleField } from '@/components/ui/toggle-field'
import { Button } from '@/components/ui/button'

export function GeneralTab() {
  const { temperature, maxTokens, shortcuts, advancedSettings, updateSettings, resetSettings } = useSettingsStore()
  const { clearAllChats } = useChatStore()

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      clearAllChats()
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          <h3 className="text-lg font-medium">Basic Settings</h3>
        </div>

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

        <div className="space-y-1">
          <ToggleField
            label="Debug mode"
            description="Log each request's provider, model, and parameters to the developer console"
            checked={advancedSettings.debugMode}
            onCheckedChange={(checked) =>
              updateSettings({ advancedSettings: { ...advancedSettings, debugMode: checked } })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Keyboard Shortcuts</label>
        {Object.entries(shortcuts).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm">{key}</span>
            <kbd className="px-2 py-1 text-xs bg-muted rounded">{value}</kbd>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-4 border-t border-border">
        <Button variant="destructive" className="w-full" onClick={handleClearHistory}>
          Clear All Chat History
        </Button>
        <Button
          variant="outline"
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={resetSettings}
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}
