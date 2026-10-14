import { useState } from 'react'
import { Brain, Plus, Trash2 } from 'lucide-react'
import { useSettingsStore } from '@/store/settings-store'
import { Button } from '@/components/ui/button'

export function KnowledgeTab() {
  const { advancedSettings, addKnowledge, removeKnowledge, toggleKnowledge } = useSettingsStore()
  const [newKnowledge, setNewKnowledge] = useState('')

  const handleAdd = () => {
    if (!newKnowledge.trim()) return
    addKnowledge(newKnowledge)
    setNewKnowledge('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5" />
        <h3 className="text-lg font-medium">Context Management</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Add context the model should always know about you or your preferences. Enabled entries are
        included in every conversation.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={newKnowledge}
          onChange={(e) => setNewKnowledge(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add knowledge or context for the model..."
          className="flex-1 p-2 text-sm rounded-md border border-input bg-background"
        />
        <Button size="icon" onClick={handleAdd} aria-label="Add">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {advancedSettings.modelKnowledge.length === 0 ? (
          <p className="text-sm text-muted-foreground">No context added yet.</p>
        ) : (
          advancedSettings.modelKnowledge.map((knowledge) => (
            <div
              key={knowledge.id}
              className="flex items-center gap-2 p-2 rounded-md border border-border"
            >
              <input
                type="checkbox"
                checked={knowledge.enabled}
                onChange={() => toggleKnowledge(knowledge.id)}
                className="h-4 w-4"
              />
              <span className="flex-1 text-sm">{knowledge.content}</span>
              <button
                onClick={() => removeKnowledge(knowledge.id)}
                className="p-1 text-destructive hover:bg-destructive/10 rounded-md"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
