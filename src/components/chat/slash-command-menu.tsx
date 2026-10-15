import { Slash } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PromptTemplate } from '@/lib/prompt-templates'

export interface SlashCommandMenuProps {
  templates: PromptTemplate[]
  activeIndex: number
  onSelect: (template: PromptTemplate) => void
  onHover: (index: number) => void
}

/** Floating autocomplete list shown above the composer while typing "/trigger". */
export function SlashCommandMenu({ templates, activeIndex, onSelect, onHover }: SlashCommandMenuProps) {
  if (templates.length === 0) return null

  return (
    <div
      role="listbox"
      className="mb-2 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-panel animate-in fade-in-0 zoom-in-95 duration-150"
    >
      {templates.map((t, index) => (
        <button
          key={t.id}
          role="option"
          aria-selected={index === activeIndex}
          onMouseEnter={() => onHover(index)}
          onClick={() => onSelect(t)}
          className={cn(
            'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
            index === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
          )}
        >
          <Slash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="font-medium">{t.trigger}</span>
            {t.description && <span className="ml-2 text-xs text-muted-foreground">{t.description}</span>}
          </span>
        </button>
      ))}
    </div>
  )
}
