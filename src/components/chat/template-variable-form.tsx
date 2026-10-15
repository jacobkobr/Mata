import { useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { expandTemplate } from '@/lib/prompt-templates'
import type { PromptTemplate } from '@/lib/prompt-templates'

export interface TemplateVariableFormProps {
  template: PromptTemplate | null
  variables: string[]
  onClose: () => void
  onExpand: (expanded: string) => void
}

/** Small form for templates with more than one {{VARIABLE}} — collects each, then expands into the composer. */
export function TemplateVariableForm({ template, variables, onClose, onExpand }: TemplateVariableFormProps) {
  const [values, setValues] = useState<Record<string, string>>({})

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setValues({})
      onClose()
    }
  }

  const handleSubmit = () => {
    if (!template) return
    onExpand(expandTemplate(template.body, values))
    setValues({})
  }

  return (
    <Modal open={!!template} onOpenChange={handleOpenChange}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>/{template?.trigger}</ModalTitle>
        </ModalHeader>
        <div className="space-y-3 p-6">
          {variables.map((name) => (
            <div key={name} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{name}</label>
              <textarea
                value={values[name] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [name]: e.target.value }))}
                rows={name.toLowerCase().includes('code') ? 4 : 2}
                autoFocus={variables[0] === name}
                className="w-full resize-none rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Insert</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
