import { useState } from 'react'
import { BrainCircuit, Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { useMemoryStore, type MemoryFact } from '@/store/memory-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const SOURCE_LABEL: Record<MemoryFact['source'], string> = {
  manual: 'Added manually',
  message: 'Saved from a message',
  detected: 'Picked up from "remember that..."',
}

export function MemoryTab() {
  const { memories, addMemory, removeMemory, toggleMemory, updateMemory, clearAllMemories } = useMemoryStore()
  const [newFact, setNewFact] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleAdd = () => {
    if (!newFact.trim()) return
    addMemory(newFact, 'manual')
    setNewFact('')
  }

  const startEdit = (fact: MemoryFact) => {
    setEditingId(fact.id)
    setEditValue(fact.content)
  }

  const saveEdit = () => {
    if (editingId && editValue.trim()) updateMemory(editingId, editValue)
    setEditingId(null)
    setEditValue('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BrainCircuit className="h-5 w-5" />
        <h3 className="text-lg font-medium">Memory</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Facts the model should remember about you across every conversation, not just the one it
        came from. Say &quot;remember that...&quot; in any chat to add one automatically, or add one here
        directly. Enabled facts are sent as context on every message, to whichever provider answers it —
        same as Settings {'>'} Knowledge, but these persist and grow over time instead of being curated up front.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={newFact}
          onChange={(e) => setNewFact(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="e.g. I prefer concise answers with no filler"
          className="flex-1 p-2 text-sm rounded-md border border-input bg-background"
        />
        <Button size="icon" onClick={handleAdd} aria-label="Add memory">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {memories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No memories yet. The model won&apos;t carry anything between conversations until you add one.
          </p>
        ) : (
          memories.map((fact) => (
            <div
              key={fact.id}
              className={cn(
                'flex items-start gap-2 p-2 rounded-md border border-border',
                !fact.enabled && 'opacity-50'
              )}
            >
              <input
                type="checkbox"
                checked={fact.enabled}
                onChange={() => toggleMemory(fact.id)}
                className="mt-1 h-4 w-4"
              />
              <div className="flex-1 min-w-0 space-y-1">
                {editingId === fact.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      className="flex-1 px-2 py-1 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit()
                        else if (e.key === 'Escape') setEditingId(null)
                      }}
                    />
                    <button onClick={saveEdit} className="p-1 hover:bg-accent rounded">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1 hover:bg-accent rounded">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm break-words">{fact.content}</span>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{SOURCE_LABEL[fact.source]}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(fact.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {editingId !== fact.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(fact)}
                    className="p-1 text-muted-foreground hover:bg-accent rounded-md"
                    aria-label="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeMemory(fact.id)}
                    className="p-1 text-destructive hover:bg-destructive/10 rounded-md"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {memories.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (window.confirm('Clear all memory? This removes every remembered fact.')) {
                clearAllMemories()
              }
            }}
          >
            Clear all memory
          </Button>
        </div>
      )}
    </div>
  )
}
