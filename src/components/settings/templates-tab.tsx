import { useState } from 'react'
import { Slash, Plus, Trash2, Pencil } from 'lucide-react'
import { usePromptTemplateStore } from '@/store/prompt-template-store'
import { getUserVariables } from '@/lib/prompt-templates'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/modal'

export function TemplatesTab() {
  const { templates, addTemplate, updateTemplate, removeTemplate } = usePromptTemplateStore()
  const [editing, setEditing] = useState<{ id: string | null; trigger: string; description: string; body: string } | null>(null)

  const openNew = () => setEditing({ id: null, trigger: '', description: '', body: '' })
  const openEdit = (id: string, trigger: string, description: string, body: string) =>
    setEditing({ id, trigger, description, body })

  const handleSave = () => {
    if (!editing || !editing.trigger.trim() || !editing.body.trim()) return
    if (editing.id) {
      updateTemplate(editing.id, { trigger: editing.trigger, description: editing.description, body: editing.body })
    } else {
      addTemplate(editing.trigger, editing.description, editing.body)
    }
    setEditing(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Slash className="h-5 w-5" />
          <h3 className="text-lg font-medium">Prompt Templates</h3>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" /> New template
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Type <code className="rounded bg-muted px-1 py-0.5 text-xs">/trigger</code> in the composer to expand a
        template. Use <code className="rounded bg-muted px-1 py-0.5 text-xs">{'{{VARIABLE}}'}</code> for a blank to
        fill in — <code className="rounded bg-muted px-1 py-0.5 text-xs">{'{{CURRENT_DATE}}'}</code>,{' '}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">{'{{CURRENT_TIME}}'}</code>, and{' '}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">{'{{CURRENT_DATETIME}}'}</code> fill in automatically.
      </p>

      <div className="space-y-2">
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No templates yet.</p>
        ) : (
          templates.map((t) => {
            const vars = getUserVariables(t.body)
            return (
              <div key={t.id} className="flex items-start gap-3 p-3 rounded-md border border-border">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">/{t.trigger}</span>
                    {vars.map(v => (
                      <Badge key={v} variant="outline" className="text-[10px]">{`{{${v}}}`}</Badge>
                    ))}
                  </div>
                  {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                  <p className="text-xs text-muted-foreground/80 whitespace-pre-wrap line-clamp-2">{t.body}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(t.id, t.trigger, t.description, t.body)}
                    className="p-1 text-muted-foreground hover:bg-accent rounded-md"
                    aria-label="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeTemplate(t.id)}
                    className="p-1 text-destructive hover:bg-destructive/10 rounded-md"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Modal open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>{editing?.id ? 'Edit template' : 'New template'}</ModalTitle>
          </ModalHeader>
          <div className="space-y-3 p-6">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Trigger</label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">/</span>
                <input
                  type="text"
                  value={editing?.trigger ?? ''}
                  onChange={(e) => setEditing(editing && { ...editing, trigger: e.target.value })}
                  placeholder="explain"
                  className="flex-1 p-2 text-sm rounded-md border border-input bg-background"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <input
                type="text"
                value={editing?.description ?? ''}
                onChange={(e) => setEditing(editing && { ...editing, description: e.target.value })}
                placeholder="What this template is for"
                className="w-full p-2 text-sm rounded-md border border-input bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Template body</label>
              <textarea
                value={editing?.body ?? ''}
                onChange={(e) => setEditing(editing && { ...editing, body: e.target.value })}
                placeholder={'Explain this code:\n\n{{code}}'}
                rows={5}
                className="w-full p-2 text-sm rounded-md border border-input bg-background resize-none"
              />
            </div>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!editing?.trigger.trim() || !editing?.body.trim()}>Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
