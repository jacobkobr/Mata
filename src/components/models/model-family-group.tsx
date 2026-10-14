import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModelFamilyGroupProps {
  family: string
  count: number
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

/** Shared collapsible family section used by both model-browsing surfaces. */
export function ModelFamilyGroup({ family, count, expanded, onToggle, children }: ModelFamilyGroupProps) {
  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-accent/50"
      >
        <ChevronRight className={cn('h-4 w-4 transition-transform', expanded && 'rotate-90')} />
        <span className="font-medium">{family}</span>
        <span className="text-sm text-muted-foreground">
          ({count} {count === 1 ? 'model' : 'models'})
        </span>
      </button>

      {expanded && <div className="space-y-3 pl-6">{children}</div>}
    </div>
  )
}
